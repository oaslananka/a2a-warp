import type { Express, Request, Response } from 'express';
import type { JwtAuthMiddleware } from '../../auth/JwtAuthMiddleware.js';
import { getRequestContext } from '../../auth/requestContext.js';
import type { RuntimeMetrics } from '../../telemetry/RuntimeMetrics.js';
import type { AgentCard } from '../../types/agent-card.js';
import type { RequestContext } from '../../types/auth.js';
import type { Task } from '../../types/task.js';
import type { IdempotencyStore } from '../IdempotencyStore.js';
import type { SSEStreamer } from '../SSEStreamer.js';
import type { TaskManager } from '../TaskManager.js';
import { signAgentCard, type SigningKey } from '../../security/AgentCardSigner.js';
import {
  createJsonRpcHttpHandler,
  type HandleRpc,
  type HandleStreamingRpc,
} from './jsonRpcHandler.js';
import { registerMetricsRoutes } from './metricsRoutes.js';
import { registerStreamRoutes } from './streamRoutes.js';

export const AGENT_CARD_PATHS = [
  '/.well-known/agent-card.json',
  '/.well-known/agent.json',
] as const;
export const JSON_RPC_PATHS = ['/', '/rpc', '/a2a/jsonrpc'] as const;

type FilterTasksByContext = (tasks: Task[], context: RequestContext) => Task[];
type CanAccessTask = (task: Task, context: RequestContext) => boolean;

export interface A2AHttpRouteDependencies {
  app: Express;
  agentCard: AgentCard;
  signingKey: SigningKey | undefined;
  startedAt: number;
  taskManager: TaskManager;
  runtimeMetrics: RuntimeMetrics;
  authMiddleware: JwtAuthMiddleware | undefined;
  streamer: SSEStreamer;
  idempotencyStore: IdempotencyStore;
  idempotencyTtlMs: number;
  handleRpc: HandleRpc;
  handleStreamingRpc: HandleStreamingRpc;
  canAccessTask: CanAccessTask;
  filterTasksByContext: FilterTasksByContext;
}

export function registerA2ARoutes(deps: A2AHttpRouteDependencies): void {
  registerAgentCardRoutes(deps);
  registerMetricsRoutes({
    app: deps.app,
    agentCard: deps.agentCard,
    startedAt: deps.startedAt,
    runtimeMetrics: deps.runtimeMetrics,
    getTaskCounts: () => deps.taskManager.getTaskCounts(),
  });

  deps.app.get('/tasks', async (req: Request, res: Response) => handleTasksRoute(req, res, deps));

  const jsonRpcHandler = createJsonRpcHttpHandler({
    authMiddleware: deps.authMiddleware,
    runtimeMetrics: deps.runtimeMetrics,
    idempotencyStore: deps.idempotencyStore,
    idempotencyTtlMs: deps.idempotencyTtlMs,
    handleRpc: deps.handleRpc,
    handleStreamingRpc: deps.handleStreamingRpc,
  });
  for (const path of JSON_RPC_PATHS) {
    deps.app.post(path, jsonRpcHandler);
  }

  registerStreamRoutes(deps.app, {
    taskManager: deps.taskManager,
    streamer: deps.streamer,
    runtimeMetrics: deps.runtimeMetrics,
    authMiddleware: deps.authMiddleware,
    canAccessTask: deps.canAccessTask,
  });
}

function registerAgentCardRoutes(
  deps: Pick<A2AHttpRouteDependencies, 'app' | 'agentCard' | 'signingKey'>,
): void {
  const serveCard = async (_req: Request, res: Response) => {
    const card = deps.signingKey
      ? await signAgentCard(deps.agentCard, deps.signingKey)
      : deps.agentCard;
    res.json(card);
  };

  for (const path of AGENT_CARD_PATHS) {
    deps.app.get(path, serveCard);
  }
}

async function handleTasksRoute(
  req: Request,
  res: Response,
  deps: Pick<
    A2AHttpRouteDependencies,
    'authMiddleware' | 'runtimeMetrics' | 'taskManager' | 'filterTasksByContext'
  >,
): Promise<void> {
  let requestContext = getRequestContext(req);
  if (deps.authMiddleware) {
    try {
      requestContext = await deps.authMiddleware.authenticateRequestContext(req);
    } catch {
      deps.runtimeMetrics.recordAuthReject();
      res.status(401).send('Unauthorized');
      return;
    }
  }

  const tasks = deps.filterTasksByContext(deps.taskManager.getAllTasks(), requestContext);
  tasks.sort(
    (a, b) => new Date(b.status.timestamp).getTime() - new Date(a.status.timestamp).getTime(),
  );

  const limit = Number(req.query['limit']) || 20;
  res.json(tasks.slice(0, limit));
}
