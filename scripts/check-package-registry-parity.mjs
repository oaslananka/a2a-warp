#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const config = JSON.parse(readFileSync('release-please-config.json', 'utf8'));
const manifest = JSON.parse(readFileSync('.release-please-manifest.json', 'utf8'));

const publishable = Object.entries(config.packages ?? {})
  .map(([path, entry]) => ({
    path,
    packageName: entry['package-name'],
    component: entry.component,
    manifestVersion: manifest[path],
    packageJson: JSON.parse(readFileSync(`${path}/package.json`, 'utf8')),
  }))
  .filter(
    (p) =>
      !p.packageJson.private &&
      p.packageJson.name &&
      !p.packageJson.name.startsWith('a2a-warp-'),
  );

const failures = [];
const missing = [];

for (const pkg of publishable) {
  let registry;
  try {
    const raw = execFileSync('npm', ['view', pkg.packageName, '--json'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 15000,
    });
    registry = JSON.parse(raw);
  } catch {
    missing.push(pkg.packageName);
    continue;
  }

  const latestTag = registry['dist-tags']?.latest;
  if (!latestTag) {
    failures.push(`${pkg.packageName}: no latest dist-tag on npm`);
    continue;
  }

  if (latestTag !== pkg.manifestVersion) {
    failures.push(
      `${pkg.packageName}: npm latest is ${latestTag}, manifest expects ${pkg.manifestVersion}`,
    );
  }

  const expectedHomepage = pkg.packageJson.homepage;
  if (expectedHomepage && registry.homepage !== expectedHomepage) {
    failures.push(
      `${pkg.packageName}: npm homepage "${registry.homepage}" !== package.json "${expectedHomepage}"`,
    );
  }

  const expectedLicense = pkg.packageJson.license;
  if (expectedLicense && registry.license !== expectedLicense) {
    failures.push(
      `${pkg.packageName}: npm license "${registry.license}" !== package.json "${expectedLicense}"`,
    );
  }

  const expectedRepo = pkg.packageJson.repository;
  if (expectedRepo) {
    const regRepo = registry.repository;
    if (regRepo?.url !== expectedRepo.url) {
      failures.push(
        `${pkg.packageName}: npm repository.url "${regRepo?.url}" !== package.json "${expectedRepo.url}"`,
      );
    }
    if (regRepo?.directory !== expectedRepo.directory) {
      failures.push(
        `${pkg.packageName}: npm repository.directory "${regRepo?.directory}" !== package.json "${expectedRepo.directory}"`,
      );
    }
  }

  if (registry.name !== pkg.packageName) {
    failures.push(
      `${pkg.packageName}: npm name "${registry.name}" !== expected "${pkg.packageName}"`,
    );
  }
}

const summary = {
  checked: publishable.length,
  verified: publishable.length - missing.length,
  missing_from_npm: missing,
  failures: failures.length,
};

if (missing.length > 0) {
  console.warn(`Packages not yet published: ${missing.join(', ')}`);
}

if (failures.length > 0) {
  console.error('Package registry parity check failed:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(`Package registry parity: ${summary.verified}/${summary.checked} verified, 0 failures.`);
