import { randomUUID } from 'node:crypto';
import type { ErrorRequestHandler, Request, RequestHandler } from 'express';
import { attachRequestContext, createAnonymousRequestContext } from '../../auth/requestContext.js';
import { ErrorCodes, type JsonRpcResponse } from '../../types/jsonrpc.js';
import { makeErrorInfo } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

export interface RequestWithRequestId extends Request {
  requestId?: string;
}

export interface OriginPolicy {
  origin: string | undefined;
  allowedOrigins?: string[] | undefined;
  requireOrigin?: boolean | undefined;
}

export function createRequestContextMiddleware(): RequestHandler {
  return (req: RequestWithRequestId, _res, next) => {
    req.requestId = req.header('x-request-id') ?? randomUUID();
    attachRequestContext(req, createAnonymousRequestContext(req));
    next();
  };
}

export function createOriginGuardMiddleware(policy: Omit<OriginPolicy, 'origin'>): RequestHandler {
  return (req, res, next) => {
    if (
      !isOriginAllowed({
        origin: req.header('origin'),
        allowedOrigins: policy.allowedOrigins,
        requireOrigin: policy.requireOrigin,
      })
    ) {
      res.status(403).send('Forbidden origin');
      return;
    }
    next();
  };
}

export function isOriginAllowed(policy: OriginPolicy): boolean {
  if (!policy.origin) {
    return !policy.requireOrigin;
  }

  const allowedOrigins = policy.allowedOrigins ?? [];
  if (allowedOrigins.length === 0) {
    logger.warn('allowedOrigins is not configured; cross-origin request rejected');
    return false;
  }

  return allowedOrigins.some((pattern) => {
    if (pattern === policy.origin) {
      return true;
    }
    if (!pattern.startsWith('*.')) {
      return false;
    }
    try {
      return new URL(policy.origin ?? '').hostname.endsWith(pattern.slice(1));
    } catch {
      return false;
    }
  });
}

export function jsonParseErrorHandler(): ErrorRequestHandler {
  return (err, _req, res, next) => {
    if (err instanceof SyntaxError && 'body' in err) {
      res.status(200).json({
        jsonrpc: '2.0',
        error: {
          code: ErrorCodes.ParseError,
          message: 'Parse error',
          data: makeErrorInfo('PARSE_ERROR'),
        },
        id: null,
      } satisfies JsonRpcResponse);
      return;
    }

    next(err);
  };
}
