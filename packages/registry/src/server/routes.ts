import { randomUUID } from 'node:crypto';
import type { Express, Request, Response } from 'express';
import { logger, normalizeAgentCard, validateSafeUrl, type AgentCard } from '@oaslananka/a2a-warp';
import type { RegisteredAgent } from '../storage/IAgentStorage.js';
import type { RegistryAuthController } from './auth.js';
import type { RegistryMetricsController } from './metrics.js';
import type { RegistryPollingController } from './polling.js';
import type { RegistrySseController } from './sse.js';
import type { RegistryTaskProjectionController } from './taskProjection.js';
import {
  createRegisteredAgentSkills,
  createRegisteredAgentTags,
  type RegistryServerContext,
} from './types.js';

export interface RegistryRouteControllers {
  auth: RegistryAuthController;
  metrics: RegistryMetricsController;
  polling: Pick<RegistryPollingController, 'refreshTaskSnapshots'>;
  sse: RegistrySseController;
  taskProjection: RegistryTaskProjectionController;
}

export function registerRegistryRoutes(
  app: Express,
  context: RegistryServerContext,
  controllers: RegistryRouteControllers,
): void {
  const { auth, metrics, polling, sse, taskProjection } = controllers;

  app.get('/health', async (_req, res) => {
    const agents = await context.store.summarize();
    res.json({
      status: 'ok',
      agents: agents.agentCount,
      healthyAgents: agents.healthyAgents,
    });
  });

  app.get('/metrics', async (_req, res) => {
    const summary = await metrics.getSummary();
    res.setHeader('Content-Type', 'text/plain; version=0.0.4');
    res.send(metrics.renderPrometheusText(summary));
  });

  app.get('/metrics/summary', async (_req, res) => {
    res.json(await metrics.getSummary());
  });

  app.get('/events', async (req: Request, res: Response) => {
    if (await auth.rejectUnauthenticatedControlPlane(req, res)) {
      return;
    }
    sse.configure(res);
    const listener = (payload: unknown) => {
      res.write(`event: registry_update\ndata: ${JSON.stringify(payload)}\n\n`);
    };
    context.events.on('registry_update', listener);
    res.on('close', () => {
      context.events.off('registry_update', listener);
    });
  });

  app.get('/agents/stream', async (req: Request, res: Response) => {
    if (await auth.rejectUnauthenticatedControlPlane(req, res)) {
      return;
    }
    sse.configure(res);

    const listener = (payload: unknown) => {
      const normalized = sse.normalizeAgentStreamPayload(payload);
      if (!normalized) {
        return;
      }
      res.write(`data: ${JSON.stringify(normalized)}\n\n`);
    };

    context.events.on('registry_update', listener);
    res.on('close', () => {
      context.events.off('registry_update', listener);
    });
  });

  const registerAgent = async (req: Request, res: Response) => {
    const requestContext = await auth.authenticateControlPlane(req, res);
    if (!requestContext) {
      return;
    }

    const body = req.body as {
      agentUrl?: string;
      agentCard?: AgentCard;
      tenantId?: string;
      isPublic?: boolean;
    };
    const { agentUrl, agentCard, tenantId, isPublic } = body;
    if (!agentUrl || !agentCard) {
      res.status(400).json({ error: 'Missing agentUrl or agentCard' });
      return;
    }

    try {
      await validateSafeUrl(agentUrl, {
        allowLocalhost: context.options.allowLocalhost ?? false,
        allowPrivateNetworks: context.options.allowPrivateNetworks ?? false,
        allowUnresolvedHostnames: context.options.allowUnresolvedHostnames ?? false,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(400).json({ error: `Invalid agentUrl: ${message}` });
      return;
    }

    const authTenantId = requestContext.tenantId;
    const finalTenantId = authTenantId ?? tenantId;
    const registered = await context.store.upsert(
      toRegisteredAgent(agentUrl, normalizeAgentCard(agentCard), finalTenantId, isPublic),
    );
    context.state.metrics.registrations += 1;
    emitRegistryEvent(context, { type: 'registered', agent: registered });
    logger.audit('register_agent', finalTenantId, `agent:${registered.id}`, 'success', {
      url: registered.url,
    });
    logger.info('Agent registered', {
      id: registered.id,
      url: registered.url,
      ...(finalTenantId ? { tenantId: finalTenantId } : {}),
    });
    res.status(201).json(registered);
  };
  app.post('/agents/register', registerAgent);
  app.post('/admin/agents/register', registerAgent);

  app.get('/agents', async (req, res) => {
    if (req.query['public'] === 'true') {
      const result = await context.store.list({
        isPublic: true,
        limit: Number.MAX_SAFE_INTEGER,
      });
      res.json(result.items);
      return;
    }

    const requestContext = await auth.authenticateControlPlane(req, res);
    if (!requestContext) {
      return;
    }

    const result = await context.store.list({
      ...(requestContext.tenantId
        ? { tenantId: requestContext.tenantId, includePublic: true }
        : {}),
      limit: Number.MAX_SAFE_INTEGER,
    });
    res.json(
      auth.shouldEnforceTenantIsolation(requestContext)
        ? auth.filterAgentsByContext(result.items, requestContext)
        : result.items,
    );
  });

  app.get('/tasks/recent', async (req, res) => {
    if (await auth.rejectUnauthenticatedControlPlane(req, res)) {
      return;
    }
    if (context.recentTasks.size === 0) {
      await polling.refreshTaskSnapshots();
    }

    const limitParam = Number(req.query['limit']);
    const limit =
      Number.isFinite(limitParam) && limitParam > 0
        ? limitParam
        : (context.options.maxRecentTasks ?? 50);

    res.json(taskProjection.getRecentTasks(limit));
  });

  app.get('/tasks/stream', async (req, res) => {
    if (await auth.rejectUnauthenticatedControlPlane(req, res)) {
      return;
    }
    sse.configure(res);

    for (const taskEvent of taskProjection.getRecentTasks(10)) {
      res.write(`data: ${JSON.stringify(taskEvent)}\n\n`);
    }

    const listener = (payload: unknown) => {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    context.taskEvents.on('task_updated', listener);
    res.on('close', () => {
      context.taskEvents.off('task_updated', listener);
    });
  });

  app.get('/agents/search', async (req, res) => {
    const skill = typeof req.query['skill'] === 'string' ? req.query['skill'] : '';
    const tag = typeof req.query['tag'] === 'string' ? req.query['tag'] : '';
    const name = typeof req.query['name'] === 'string' ? req.query['name'] : '';
    const transport = req.query['transport'] as 'http' | 'sse' | 'ws' | 'grpc' | undefined;
    const status = req.query['status'] as 'healthy' | 'unhealthy' | 'unknown' | undefined;
    const mcpCompatible =
      req.query['mcpCompatible'] === 'true'
        ? true
        : req.query['mcpCompatible'] === 'false'
          ? false
          : undefined;

    if (!skill && !tag && !name && !transport && !status && mcpCompatible === undefined) {
      res.status(400).json({
        error:
          'At least one filter (skill, tag, name, transport, status, mcpCompatible) is required',
      });
      return;
    }

    context.state.metrics.searches += 1;
    const query = {
      ...(skill ? { skill } : {}),
      ...(tag ? { tag } : {}),
      ...(name ? { name } : {}),
      ...(transport ? { transport } : {}),
      ...(status ? { status } : {}),
      ...(mcpCompatible !== undefined ? { mcpCompatible } : {}),
      limit: Number.MAX_SAFE_INTEGER,
    } as const;

    if (req.query['public'] === 'true') {
      res.json((await context.store.list({ ...query, isPublic: true })).items);
      return;
    }

    const requestContext = await auth.authenticateControlPlane(req, res);
    if (!requestContext) {
      return;
    }

    const matches = await context.store.list({
      ...query,
      ...(requestContext.tenantId
        ? { tenantId: requestContext.tenantId, includePublic: true }
        : {}),
    });
    res.json(
      auth.shouldEnforceTenantIsolation(requestContext)
        ? auth.filterAgentsByContext(matches.items, requestContext)
        : matches.items,
    );
  });

  app.get('/agents/:id', async (req, res) => {
    const agentId = routeParam(req.params['id']);
    if (!agentId) {
      res.status(400).json({ error: 'Missing agent id' });
      return;
    }

    const agent = await context.store.get(agentId);
    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
    if (!agent.isPublic) {
      const requestContext = await auth.authenticateControlPlane(req, res);
      if (!requestContext) {
        return;
      }
      if (!auth.canAccessAgent(agent, requestContext)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
    }
    res.json(agent);
  });

  const heartbeatAgent = async (req: Request, res: Response) => {
    const agentId = routeParam(req.params['id']);
    if (!agentId) {
      res.status(400).json({ error: 'Missing agent id' });
      return;
    }

    const requestContext = await auth.authenticateControlPlane(req, res);
    if (!requestContext) {
      return;
    }
    const agent = await context.store.get(agentId);
    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
    if (!auth.canAccessAgent(agent, requestContext)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const updated: RegisteredAgent = {
      ...agent,
      status: 'healthy',
      lastHeartbeatAt: new Date().toISOString(),
      consecutiveFailures: 0,
      lastSuccessAt: new Date().toISOString(),
    };
    await context.store.upsert(updated);
    context.nextHealthCheckAt.set(
      updated.id,
      Date.now() + (context.options.healthyRecheckIntervalMs ?? 30_000),
    );
    context.state.metrics.heartbeats += 1;
    emitRegistryEvent(context, { type: 'heartbeat', agent: updated });
    res.json(updated);
  };
  app.post('/agents/:id/heartbeat', heartbeatAgent);
  app.post('/admin/agents/:id/heartbeat', heartbeatAgent);

  const deleteAgent = async (req: Request, res: Response) => {
    const agentId = routeParam(req.params['id']);
    if (!agentId) {
      res.status(400).json({ error: 'Missing agent id' });
      return;
    }

    const requestContext = await auth.authenticateControlPlane(req, res);
    if (!requestContext) {
      return;
    }

    const agent = await context.store.get(agentId);
    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
    if (!auth.canAccessAgent(agent, requestContext)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    const deleted = await context.store.delete(agentId);
    if (!deleted) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
    const tenantId = requestContext.tenantId;
    logger.audit('delete_agent', tenantId, `agent:${agentId}`, 'success');
    taskProjection.purgeAgentTaskState(agentId);
    emitRegistryEvent(context, { type: 'deleted', id: agentId });
    res.status(204).send();
  };
  app.delete('/agents/:id', deleteAgent);
  app.delete('/admin/agents/:id', deleteAgent);
}

function routeParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function emitRegistryEvent(context: RegistryServerContext, payload: unknown): void {
  context.events.emit('registry_update', payload);
}

function toRegisteredAgent(
  agentUrl: string,
  card: AgentCard,
  tenantId?: string,
  isPublic?: boolean,
): RegisteredAgent {
  return {
    id: randomUUID(),
    url: agentUrl,
    card,
    status: 'unknown',
    tags: createRegisteredAgentTags(card),
    skills: createRegisteredAgentSkills(card),
    registeredAt: new Date().toISOString(),
    ...(tenantId ? { tenantId } : {}),
    ...(typeof isPublic === 'boolean' ? { isPublic } : {}),
  };
}
