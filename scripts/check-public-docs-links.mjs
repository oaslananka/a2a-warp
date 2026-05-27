import { pathToFileURL } from 'node:url';
import { fail } from './check-utils.mjs';

export const DEFAULT_DOCS_BASE_URL = 'https://oaslananka.github.io/a2a-warp/';
export const REQUIRED_PUBLIC_DOCS_PATHS = [
  { path: '/', label: 'homepage' },
  { path: '/guide/introduction', label: 'docs index' },
  { path: '/guide/installation', label: 'install guide' },
  { path: '/guide/quick-start', label: 'quick start' },
  { path: '/guide/compatibility', label: 'compatibility guide' },
  { path: '/packages/core', label: 'package docs' },
  { path: '/api/core', label: 'API docs' },
  { path: '/cli/', label: 'CLI docs' },
  { path: '/security/threat-model', label: 'threat model' },
  { path: '/release/process', label: 'release process' },
];

const DEFAULT_TIMEOUT_MS = 10_000;
const HTML_CONTENT_TYPE = 'text/html';
const HOME_TITLE = 'A2A Warp';

export function normalizeBaseUrl(baseUrl = DEFAULT_DOCS_BASE_URL) {
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
}

export function buildDocsUrl(baseUrl, path) {
  const normalizedPath = path === '/' ? '' : path.replace(/^\/+/, '');
  return new URL(normalizedPath, normalizeBaseUrl(baseUrl)).toString();
}

export async function checkPublicDocsLinks(options = {}) {
  const baseUrl = options.baseUrl ?? process.env.DOCS_BASE_URL ?? DEFAULT_DOCS_BASE_URL;
  const timeoutMs = options.timeoutMs ?? readTimeoutMs();
  const failures = await Promise.all(
    REQUIRED_PUBLIC_DOCS_PATHS.map((page) => checkDocsPage(baseUrl, page, timeoutMs)),
  );
  return failures.filter(Boolean);
}

function readTimeoutMs() {
  const configured = Number.parseInt(process.env.DOCS_LINK_TIMEOUT_MS ?? '', 10);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_TIMEOUT_MS;
}

async function checkDocsPage(baseUrl, page, timeoutMs) {
  const url = buildDocsUrl(baseUrl, page.path);
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    const failure = await validateResponse(page, url, response);
    return failure;
  } catch (error) {
    return `${page.path} (${page.label}) request failed for ${url}: ${String(error)}`;
  }
}

async function validateResponse(page, url, response) {
  if (!response.ok) {
    return `${page.path} (${page.label}) returned HTTP ${response.status} for ${url}`;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes(HTML_CONTENT_TYPE)) {
    return `${page.path} (${page.label}) returned non-HTML content-type ${contentType}`;
  }

  if (page.path === '/') return validateHomePageTitle(page, await response.text());
  return '';
}

function validateHomePageTitle(page, body) {
  if (body.includes(HOME_TITLE)) return '';
  return `${page.path} (${page.label}) did not include ${HOME_TITLE}`;
}

async function main() {
  const failures = await checkPublicDocsLinks();
  if (failures.length > 0) fail('Public docs link validation failed.', failures);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  await main();
}
