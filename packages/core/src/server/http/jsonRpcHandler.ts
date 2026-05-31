import type { Request, RequestHandler, Response } from 'express';
import type { JwtAuthMiddleware } from '../../auth/index.js';
import { getRequestContext } from '../../auth/index.js';
import { a2aWarpTracer, SpanStatusCode } from '../../telemetry/index.js';
import type { RuntimeMetrics } from '../../telemetry/index.js';
import type { AgentCard } from '../../types/agent-card.js';
import { getDocsUrl } from '../../config/docs.js';
import type { RequestContext } from '../../types/auth.js';
import type { A2AExtension } from '../../types/extensions.js';
import {
  ErrorCodes,
  JsonRpcError,
  type JsonRpcFailureResponse,
  type JsonRpcId,
  type JsonRpcRequest,
  type JsonRpcSuccessResponse,
} from '../../types/jsonrpc.js';
import type {
  Artifact,
  ExtensibleArtifact,
  Message,
  MessageSendParams,
  PushNotificationConfig,
  Task,
} from '../../types/task.js';
import { normalizeMessage } from '../../utils/compat.js';
import { logger } from '../../utils/logger.js';
import {
  PushNotificationConfigSchema,
  validateJsonRpcRequest,
  validateMessageSendParams,
  validateRequest,
  validateTaskListParams,
} from '../../utils/schema-validator.js';
import type { IdempotencyStore } from '../IdempotencyStore.js';
import { TaskLifecycleError, type TaskManager } from '../TaskManager.js';
import {
  decorateIdempotentResult,
  extractJsonRpcId,
  resolveIdempotency,
  type IdempotencyResolution,
} from './idempotency.js';
import { toLifecycleJsonRpcError } from './lifecycleErrors.js';
import type { RequestWithRequestId } from './middleware.js';
import { isStreamingRpcMethod } from './streamRoutes.js';

export interface RpcContext {
  req: Request;
  requestContext: RequestContext;
}

export type HandleRpc = (rpcReq: JsonRpcRequest, context: RpcContext) => Promise<unknown>;

export type HandleStreamingRpc = (
  rpcReq: JsonRpcRequest,
  context: RpcContext,
  res: Response,
  idempotency?: IdempotencyResolution,
) => Promise<void>;

type NormalizePushNotificationConfig = (
  config: PushNotificationConfig,
) => Promise<PushNotificationConfig>;

type ProcessTask = (task: Task, message: Message, signal?: AbortSignal) => Promise<void>;

export interface MessageRequestDependencies {
  agentCard: AgentCard;
  taskManager: TaskManager;
  authMiddleware: JwtAuthMiddleware | undefined;
  normalizePushNotificationConfig: NormalizePushNotificationConfig;
  processTask: ProcessTask;
}

export interface RpcHandlerDependencies extends MessageRequestDependencies {
  runtimeMetrics: RuntimeMetrics;
}

export interface JsonRpcHttpHandlerDependencies {
  authMiddleware: JwtAuthMiddleware | undefined;
  runtimeMetrics: RuntimeMetrics;
  idempotencyStore: IdempotencyStore;
  idempotencyTtlMs: number;
  handleRpc: HandleRpc;
  handleStreamingRpc: HandleStreamingRpc;
}

export function createJsonRpcSuccessResponse<T>(
  result: T,
  id: JsonRpcId,
): JsonRpcSuccessResponse<T> {
  return {
    jsonrpc: '2.0',
    result,
    id,
  };
}

export function createJsonRpcErrorResponse(
  error: Pick<JsonRpcError, 'code' | 'message' | 'data'>,
  id: JsonRpcId,
): JsonRpcFailureResponse {
  return {
    jsonrpc: '2.0',
    error: {
      code: error.code,
      message: error.message,
      ...(error.data ? { data: error.data } : {}),
    },
    id,
  };
}

export function createJsonRpcHttpHandler(deps: JsonRpcHttpHandlerDependencies): RequestHandler {
  return async (req, res) => {
    let idempotency: IdempotencyResolution | null | undefined;
    try {
      if (Array.isArray(req.body)) {
        throw new JsonRpcError(ErrorCodes.InvalidRequest, 'Batch requests are not supported');
      }

      const rpcReq = validateJsonRpcRequest(req.body);
      let requestContext = getRequestContext(req);
      if (deps.authMiddleware) {
        try {
          requestContext = await deps.authMiddleware.authenticateRequestContext(req);
        } catch (error: unknown) {
          deps.runtimeMetrics.recordAuthReject();
          throw new JsonRpcError(ErrorCodes.Unauthorized, 'Unauthorized', {
            reason: String(error),
          });
        }
      }

      idempotency = await resolveIdempotency(
        req,
        rpcReq,
        requestContext,
        res,
        deps.idempotencyStore,
        isStreamingRpcMethod(rpcReq.method),
      );
      if (idempotency === null) {
        return;
      }

      if (isStreamingRpcMethod(rpcReq.method)) {
        await deps.handleStreamingRpc(
          rpcReq,
          { req, requestContext },
          res,
          idempotency ?? undefined,
        );
        return;
      }

      const result = await deps.handleRpc(rpcReq, { req, requestContext });
      const responseResult = idempotency
        ? decorateIdempotentResult(result, idempotency, false)
        : result;
      if (idempotency) {
        await deps.idempotencyStore.set(
          idempotency.scope,
          idempotency.key,
          idempotency.fingerprint,
          {
            kind: 'success',
            value: structuredClone(responseResult),
          },
          deps.idempotencyTtlMs,
        );
      }
      res.json(createJsonRpcSuccessResponse(responseResult, rpcReq.id ?? null));
    } catch (err: unknown) {
      await writeJsonRpcErrorResponse(req, res, err, idempotency, deps);
    }
  };
}

async function writeJsonRpcErrorResponse(
  req: Request,
  res: Response,
  err: unknown,
  idempotency: IdempotencyResolution | null | undefined,
  deps: Pick<JsonRpcHttpHandlerDependencies, 'idempotencyStore' | 'idempotencyTtlMs'>,
): Promise<void> {
  const responseId = extractJsonRpcId(req.body);
  if (err instanceof JsonRpcError) {
    if (idempotency && err.code !== ErrorCodes.IdempotencyConflict) {
      const error = {
        code: err.code,
        message: err.message,
        ...(err.data ? { data: err.data } : {}),
      };
      await deps.idempotencyStore.set(
        idempotency.scope,
        idempotency.key,
        idempotency.fingerprint,
        {
          kind: 'error',
          error,
        },
        deps.idempotencyTtlMs,
      );
    }
    res.json(createJsonRpcErrorResponse(err, responseId));
    return;
  }

  logger.error('Unhandled internal error', { error: String(err) });
  res.json(
    createJsonRpcErrorResponse(
      new JsonRpcError(ErrorCodes.InternalError, 'Internal Error'),
      responseId,
    ),
  );
}

export function getTaskOrThrow(
  taskId: unknown,
  taskManager: TaskManager,
  requestContext: RequestContext,
  canAccessTaskFn: (task: Task, context: RequestContext) => boolean,
): Task {
  if (typeof taskId !== 'string') {
    throw new JsonRpcError(ErrorCodes.InvalidParams, 'Missing taskId');
  }
  const task = taskManager.getTask(taskId);
  if (!task) {
    throw new JsonRpcError(ErrorCodes.TaskNotFound, 'Task not found');
  }
  if (!canAccessTaskFn(task, requestContext)) {
    throw new JsonRpcError(ErrorCodes.Unauthorized, 'Unauthorized task access');
  }
  return task;
}

export async function handleRpcRequest(
  req: JsonRpcRequest,
  context: RpcContext,
  deps: RpcHandlerDependencies,
): Promise<unknown> {
  const span = a2aWarpTracer.startSpan('a2a.handleRpc', {
    attributes: {
      'rpc.method': req.method,
      'a2a.agent_name': deps.agentCard.name,
    },
  });
  const requestId = (context.req as RequestWithRequestId).requestId;
  const startedAt = Date.now();
  let failed = false;

  try {
    const params = (req.params ?? {}) as Record<string, unknown>;
    switch (req.method) {
      case 'message/send':
        return await handleMessageRequest(
          validateMessageSendParams(params),
          req.method,
          context.req,
          undefined,
          deps,
        );

      case 'message/stream':
      case 'tasks/resubscribe':
        throw new JsonRpcError(
          ErrorCodes.UnsupportedOperation,
          `${req.method} requires an SSE response transport`,
        );

      case 'tasks/get': {
        return getTaskOrThrow(
          params['taskId'],
          deps.taskManager,
          context.requestContext,
          (t, ctx) => canAccessTask(t, ctx, deps.authMiddleware),
        );
      }

      case 'tasks/cancel': {
        const existingTask = getTaskOrThrow(
          params['taskId'],
          deps.taskManager,
          context.requestContext,
          (t, ctx) => canAccessTask(t, ctx, deps.authMiddleware),
        );
        const task = deps.taskManager.cancelTask(existingTask.id);
        if (!task) {
          throw new JsonRpcError(ErrorCodes.TaskNotFound, 'Task not found');
        }
        return task;
      }

      case 'tasks/pushNotification/set': {
        const rawPushNotificationConfig = params['pushNotificationConfig'];
        if (!rawPushNotificationConfig || typeof rawPushNotificationConfig !== 'object') {
          throw new JsonRpcError(
            ErrorCodes.InvalidParams,
            'Missing taskId or pushNotificationConfig',
          );
        }
        const task = getTaskOrThrow(
          params['taskId'],
          deps.taskManager,
          context.requestContext,
          (t, ctx) => canAccessTask(t, ctx, deps.authMiddleware),
        );
        const pushNotificationConfig = validateRequest(
          PushNotificationConfigSchema,
          rawPushNotificationConfig,
        ) as PushNotificationConfig;
        const normalizedPushNotificationConfig =
          await deps.normalizePushNotificationConfig(pushNotificationConfig);
        return deps.taskManager.setPushNotification(task.id, normalizedPushNotificationConfig);
      }

      case 'tasks/pushNotification/get': {
        const task = getTaskOrThrow(
          params['taskId'],
          deps.taskManager,
          context.requestContext,
          (t, ctx) => canAccessTask(t, ctx, deps.authMiddleware),
        );
        return deps.taskManager.getPushNotification(task.id) ?? null;
      }

      case 'tasks/list': {
        const { contextId, limit = 50, offset = 0 } = validateTaskListParams(params);
        let tasks = contextId
          ? deps.taskManager.getTasksByContext(contextId)
          : deps.taskManager.getAllTasks();

        tasks = filterTasksByContext(tasks, context.requestContext, deps.authMiddleware);

        return {
          tasks: tasks.slice(offset, offset + limit),
          total: tasks.length,
        };
      }

      case 'agent/authenticatedExtendedCard': {
        if (!deps.agentCard.capabilities?.extendedAgentCard) {
          throw new JsonRpcError(ErrorCodes.UnsupportedOperation, 'Extended card not supported');
        }
        return deps.agentCard;
      }

      default:
        throw new JsonRpcError(ErrorCodes.MethodNotFound, `Method ${req.method} not found`);
    }
  } catch (error: unknown) {
    if (error instanceof TaskLifecycleError) {
      throw toLifecycleJsonRpcError(error);
    }
    failed = true;
    span.setStatus({ code: SpanStatusCode.ERROR, message: String(error) });
    throw error;
  } finally {
    if (!failed) {
      span.setStatus({ code: SpanStatusCode.OK });
    }
    span.end();
    logger.info('Handled RPC request', {
      ...(requestId ? { requestId } : {}),
      ...(context.requestContext.principalId
        ? { principalId: context.requestContext.principalId }
        : {}),
      ...(context.requestContext.tenantId ? { tenantId: context.requestContext.tenantId } : {}),
      method: req.method,
      agentName: deps.agentCard.name,
      durationMs: Date.now() - startedAt,
    });
  }
}

export async function handleMessageRequest(
  params: MessageSendParams,
  method: string,
  req: Request | undefined,
  signal: AbortSignal | undefined,
  deps: MessageRequestDependencies,
): Promise<Task> {
  const requestContext = req ? getRequestContext(req) : undefined;
  const principalId = requestContext?.principalId;
  const tenantId = requestContext?.tenantId;

  let task: Task | null = null;

  if (params.taskId) {
    task = deps.taskManager.getTask(params.taskId) ?? null;
    if (!task) {
      throw new JsonRpcError(ErrorCodes.TaskNotFound, 'Task not found');
    }
    if (requestContext && !canAccessTask(task, requestContext, deps.authMiddleware)) {
      throw new JsonRpcError(ErrorCodes.Unauthorized, 'Unauthorized task access');
    }
  } else {
    task = deps.taskManager.createTask(
      params.sessionId,
      params.contextId ?? params.message.contextId,
      principalId,
      tenantId,
    );
    logger.audit(
      'task_created',
      principalId,
      `task:${task.id}`,
      'success',
      tenantId ? { tenantId } : {},
    );
  }

  const pushNotificationConfig = params.configuration?.pushNotificationConfig
    ? await deps.normalizePushNotificationConfig(params.configuration.pushNotificationConfig)
    : undefined;

  const appliedExtensions = negotiateExtensions(
    deps.agentCard,
    params.configuration?.extensions ?? [],
  );
  deps.taskManager.setTaskExtensions(task.id, appliedExtensions);
  if (pushNotificationConfig) {
    deps.taskManager.setPushNotification(task.id, pushNotificationConfig);
  }

  const message = normalizeMessage({
    ...params.message,
    kind: params.message.kind ?? 'message',
    ...((params.message.contextId ?? task.contextId)
      ? { contextId: params.message.contextId ?? task.contextId }
      : {}),
  });
  deps.taskManager.addHistoryMessage(task.id, message);
  deps.taskManager.updateTaskState(task.id, 'WORKING');

  deps.processTask(task, message, signal).catch((error) => {
    logger.error('Task processing failed', {
      taskId: task.id,
      ...(task.contextId ? { contextId: task.contextId } : {}),
      error,
    });
  });

  if (method === 'message/stream') {
    return deps.taskManager.getTask(task.id) ?? task;
  }

  return deps.taskManager.getTask(task.id) ?? task;
}

function negotiateExtensions(agentCard: AgentCard, requestedExtensions: A2AExtension[]): string[] {
  if (requestedExtensions.length === 0) {
    return [];
  }

  const supported = new Set((agentCard.extensions ?? []).map((extension) => extension.uri));
  const applied: string[] = [];
  for (const extension of requestedExtensions) {
    if (supported.has(extension.uri)) {
      applied.push(extension.uri);
      continue;
    }

    if (extension.required) {
      throw new JsonRpcError(
        ErrorCodes.ExtensionRequired,
        `Required extension not supported: ${extension.uri}. See: ${getDocsUrl('protocol/extensions')}`,
      );
    }
  }

  return applied;
}

export function normalizeArtifacts(task: Task, artifacts: Artifact[]): ExtensibleArtifact[] {
  return artifacts.map((artifact) => ({
    ...artifact,
    ...(((artifact as ExtensibleArtifact).extensions ?? task.extensions)
      ? { extensions: (artifact as ExtensibleArtifact).extensions ?? task.extensions }
      : {}),
    metadata: {
      ...((artifact as ExtensibleArtifact).metadata ?? {}),
      taskId: task.id,
      ...(task.contextId ? { contextId: task.contextId } : {}),
      appliedExtensions: task.extensions ?? [],
    },
  }));
}

export function filterTasksByContext(
  tasks: Task[],
  context: RequestContext,
  authMiddleware: JwtAuthMiddleware | undefined,
): Task[] {
  if (!shouldEnforceTaskOwnership(context, authMiddleware)) {
    return tasks;
  }

  return tasks.filter((task) => canAccessTask(task, context, authMiddleware));
}

export function canAccessTask(
  task: Task,
  context: RequestContext,
  authMiddleware: JwtAuthMiddleware | undefined,
): boolean {
  if (!shouldEnforceTaskOwnership(context, authMiddleware)) {
    return true;
  }

  if (task.principalId && task.principalId !== context.principalId) {
    return false;
  }
  if (task.tenantId && task.tenantId !== context.tenantId) {
    return false;
  }

  return true;
}

function shouldEnforceTaskOwnership(
  context: RequestContext,
  authMiddleware: JwtAuthMiddleware | undefined,
): boolean {
  return Boolean(authMiddleware) || context.authMethod !== 'anonymous';
}
