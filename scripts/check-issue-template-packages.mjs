import { readText, fail } from './check-utils.mjs';

const expected = [
  '@oaslananka/a2a-warp',
  '@oaslananka/a2a-warp-adapter-anthropic',
  '@oaslananka/a2a-warp-adapter-base',
  '@oaslananka/a2a-warp-adapter-crewai',
  '@oaslananka/a2a-warp-adapter-google-adk',
  '@oaslananka/a2a-warp-adapter-langchain',
  '@oaslananka/a2a-warp-adapter-llamaindex',
  '@oaslananka/a2a-warp-adapter-openai',
  '@oaslananka/a2a-warp-adapters',
  '@oaslananka/a2a-warp-bridge-mcp',
  '@oaslananka/a2a-warp-cli',
  '@oaslananka/a2a-warp-core',
  '@oaslananka/a2a-warp-registry',
  '@oaslananka/a2a-warp-schemas',
  '@oaslananka/a2a-warp-transport-grpc',
  '@oaslananka/a2a-warp-transport-ws',
  'create-a2a-warp',
  'Other',
];
const text = readText('.github/ISSUE_TEMPLATE/bug_report.yml');
const failures = [];
for (const option of expected) {
  if (!text.includes(`- '${option}'`)) failures.push(`missing issue-template option ${option}`);
}
if (/@a2a-warp[a-z]/.test(text) || /@a2a-mesh/i.test(text))
  failures.push('malformed scoped package option found');
if (failures.length > 0) fail('Issue-template package validation failed.', failures);
