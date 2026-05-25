import { readText, fail } from './check-utils.mjs';

const required = ['validate', 'discover', 'send', 'monitor', 'benchmark', 'conformance', 'doctor'];
const failures = [];
for (const command of required) {
  const path = `docs/cli/${command}.md`;
  let text = '';
  try {
    text = readText(path);
  } catch {
    failures.push(`${path}: missing`);
    continue;
  }
  if (!text.includes(`a2a-warp ${command}`)) failures.push(`${path}: missing command example`);
}
const readme = readText('README.md');
for (const command of required) {
  if (!readme.includes(`a2a-warp ${command}`))
    failures.push(`README.md: missing ${command} example`);
}
if (failures.length > 0) fail('Command documentation validation failed.', failures);
