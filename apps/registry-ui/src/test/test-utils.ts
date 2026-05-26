import { vi } from 'vitest';
import type { AgentStreamPayload, RegistryTaskEvent } from '../api/registry';

interface FetchRoute {
  path: string;
  status?: number;
  body?: unknown;
}

function routePath(input: RequestInfo | URL): string {
  const raw = input instanceof Request ? input.url : input.toString();
  const url = new URL(raw, 'http://localhost');
  return `${url.pathname}${url.search}`;
}

export function installFetchMock(routes: FetchRoute[]) {
  const calls: string[] = [];

  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, _init?: RequestInit): Promise<Response> => {
      const path = routePath(input);
      calls.push(path);

      const route = routes.find((candidate) => candidate.path === path);
      if (!route) {
        throw new Error(`Unexpected registry UI fetch: ${path}`);
      }

      const body = route.body === undefined ? null : JSON.stringify(route.body);
      return new Response(body, {
        status: route.status ?? 200,
        headers: body === null ? undefined : { 'Content-Type': 'application/json' },
      });
    },
  );

  vi.stubGlobal('fetch', fetchMock);

  return { calls, fetchMock };
}

export class MockRegistryEventSource {
  static instances: MockRegistryEventSource[] = [];

  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  closed = false;

  constructor(readonly url: string) {
    MockRegistryEventSource.instances.push(this);
  }

  static reset() {
    MockRegistryEventSource.instances = [];
  }

  emitJson(payload: AgentStreamPayload | RegistryTaskEvent) {
    this.onmessage?.(
      new MessageEvent('message', {
        data: JSON.stringify(payload),
      }),
    );
  }

  emitMalformed(data = '{not-json') {
    this.onmessage?.(
      new MessageEvent('message', {
        data,
      }),
    );
  }

  fail() {
    this.onerror?.(new Event('error'));
  }

  close() {
    this.closed = true;
  }
}

export function installEventSourceMock() {
  MockRegistryEventSource.reset();
  vi.stubGlobal('EventSource', MockRegistryEventSource as unknown as typeof EventSource);
  return MockRegistryEventSource;
}
