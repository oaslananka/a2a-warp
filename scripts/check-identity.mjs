import { isTextFile, listFiles, readText, fail } from './check-utils.mjs';

const forbidden = [
  /a2a-mesh/gi,
  /a2a mesh/gi,
  /a2amesh/gi,
  /@a2a-mesh/gi,
  /github\.com\/oaslananka\/a2a-mesh/gi,
  /ghcr\.io\/oaslananka\/a2a-mesh/gi,
  /create-a2a-mesh/gi,
  /A2A Mesh/g,
  // Deprecated standalone package names — these must never appear as npm package names
  // (they are available only as subpath exports under @oaslananka/a2a-warp)
  /@oaslananka\/a2a-warp-client\b/gi,
  /@oaslananka\/a2a-warp-testing\b/gi,
  /@oaslananka\/a2a-warp-codex-bridge\b/gi,
];
const allow = [
  /^docs\/migrating\/a2a-mesh-to-a2a-warp\.md$/,
  /^CHANGELOG\.md$/,
  /^scripts\/check-.*\.mjs$/,
  // Historical changelogs may reference deprecated standalone package names
  /\/CHANGELOG\.md$/,
];
const failures = [];
for (const file of listFiles()) {
  if (!isTextFile(file)) continue;
  if (allow.some((rule) => rule.test(file))) continue;
  const text = readText(file);
  for (const pattern of forbidden) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) failures.push(`${file}: ${match[0]}`);
  }
}
if (failures.length > 0) fail('Stale identity references found.', failures.slice(0, 100));
