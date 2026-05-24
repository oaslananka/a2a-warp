import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

const config = JSON.parse(await readFile('release-please-config.json', 'utf8'));
const manifest = JSON.parse(await readFile('.release-please-manifest.json', 'utf8'));

if (config['release-type'] !== 'node') {
  throw new Error('release-please-config.json must use node release type');
}

if (!config.packages || typeof config.packages !== 'object') {
  throw new Error('release-please-config.json must define manifest packages');
}

for (const [packagePath, packageConfig] of Object.entries(config.packages)) {
  const packageJson = JSON.parse(await readFile(`${packagePath}/package.json`, 'utf8'));
  if (packageConfig['package-name'] !== packageJson.name) {
    throw new Error(`${packagePath} package-name does not match package.json name`);
  }
  if (!manifest[packagePath]) {
    throw new Error(`${packagePath} is missing from .release-please-manifest.json`);
  }
  if (manifest[packagePath] !== packageJson.version) {
    throw new Error(`${packagePath} manifest version does not match package.json version`);
  }
}

const npmArtifactDir = '.artifacts/npm';
const npmArtifacts = await readdir(npmArtifactDir);
const packageTarballs = npmArtifacts.filter((entry) => entry.endsWith('.tgz')).sort();
if (packageTarballs.length === 0) {
  throw new Error(`${npmArtifactDir} must contain release package tarballs`);
}

const checksumPath = `${npmArtifactDir}/SHA256SUMS`;
let checksumText;
try {
  checksumText = await readFile(checksumPath, 'utf8');
} catch (error) {
  if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
    throw new Error(`release artifacts must include ${checksumPath}`);
  }
  throw error;
}

const checksums = new Map();
for (const line of checksumText.trim().split('\n').filter(Boolean)) {
  const match = /^([a-f0-9]{64}) {2}(.+\.tgz)$/.exec(line);
  if (!match) {
    throw new Error(`${checksumPath} contains an invalid checksum entry: ${line}`);
  }
  checksums.set(match[2], match[1]);
}

for (const tarball of packageTarballs) {
  const expectedChecksum = checksums.get(tarball);
  if (!expectedChecksum) {
    throw new Error(`${checksumPath} is missing checksum for ${tarball}`);
  }
  const actualChecksum = createHash('sha256')
    .update(await readFile(join(npmArtifactDir, tarball)))
    .digest('hex');
  if (actualChecksum !== expectedChecksum) {
    throw new Error(`${checksumPath} checksum mismatch for ${tarball}`);
  }
}

for (const tarball of checksums.keys()) {
  if (!packageTarballs.includes(tarball)) {
    throw new Error(`${checksumPath} references missing tarball ${tarball}`);
  }
}

const sbomPath = '.artifacts/sbom/a2a-warp.cdx.json';
let sbomText;
try {
  sbomText = await readFile(sbomPath, 'utf8');
} catch (error) {
  if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
    throw new Error(`release artifacts must include ${sbomPath}`);
  }
  throw error;
}

const sbom = JSON.parse(sbomText);
if (sbom.bomFormat !== 'CycloneDX') {
  throw new Error(`${sbomPath} must be a CycloneDX SBOM`);
}

console.log('release-please manifest configuration validated locally.');
