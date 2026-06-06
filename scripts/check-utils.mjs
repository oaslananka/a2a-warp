import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const repoRoot = process.cwd();
const textExtensions = new Set([
  '.cjs',
  '.css',
  '.html',
  '.js',
  '.json',
  '.jsonc',
  '.md',
  '.mjs',
  '.mts',
  '.scss',
  '.svg',
  '.toml',
  '.ts',
  '.tsx',
  '.txt',
  '.yaml',
  '.yml',
]);
const textNames = new Set([
  '.codespellrc',
  '.dockerignore',
  '.editorconfig',
  '.gitattributes',
  '.gitignore',
  '.npmrc',
  '.prettierignore',
  'CODEOWNERS',
  'LICENSE',
  'Taskfile.yml',
]);
const skippedDirs = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'coverage',
  'test-results',
  '.turbo',
  '.cache',
  '.nyc_output',
  '.playwright',
  '.artifacts',
  '.codex-checkpoints',
]);

function normalizePath(path) {
  return path.split('\\').join('/');
}

function isSkippedPath(path) {
  const normalized = normalizePath(path);
  return normalized.split('/').some((part) => skippedDirs.has(part));
}

export function isTextFile(path) {
  const name = path.split(/[\\/]/).pop() ?? '';
  return textNames.has(name) || textExtensions.has(extname(name));
}

function listGitFiles() {
  try {
    const output = execFileSync(
      'git',
      ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      },
    );
    return output
      .split('\0')
      .filter(Boolean)
      .map(normalizePath)
      .filter((file) => existsSync(join(repoRoot, file)))
      .filter((file) => !isSkippedPath(file))
      .sort();
  } catch {
    return undefined;
  }
}

export function listFiles(dir = repoRoot, files = []) {
  if (dir === repoRoot && files.length === 0) {
    const gitFiles = listGitFiles();
    if (gitFiles) return gitFiles;
  }
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    const rel = normalizePath(relative(repoRoot, full));
    if (entry.isDirectory()) {
      if (!isSkippedPath(rel)) listFiles(full, files);
    } else if (entry.isFile()) {
      files.push(rel);
    }
  }
  return files.sort();
}

export function readText(relPath) {
  return readFileSync(join(repoRoot, relPath), 'utf8');
}

export function readJson(relPath) {
  return JSON.parse(readText(relPath));
}

export function runCommandSync(file, args, options = {}) {
  if (process.platform === 'win32' && file.toLowerCase().endsWith('.cmd')) {
    // Quote the .cmd path so cmd.exe /c treats it as a single token even if
    // the absolute path contains spaces.  execFileSync already avoids a
    // shell, but /c still concatenates the remaining arguments into one
    // command line string.
    return execFileSync('cmd.exe', ['/d', '/s', '/c', `"${file}"`, ...args], options);
  }
  return execFileSync(file, args, options);
}

export function runPnpmSync(args, options = {}) {
  const pnpmExecPath = process.env.npm_execpath;
  if (pnpmExecPath) {
    return execFileSync(process.execPath, [pnpmExecPath, ...args], options);
  }
  const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  return runCommandSync(command, args, options);
}

export function fail(message, details = []) {
  console.error(message);
  for (const detail of details) {
    console.error(`- ${detail}`);
  }
  process.exitCode = 1;
}

function collectPackageJsonFiles() {
  return listFiles().filter((file) => file.endsWith('package.json') && !isSkippedPath(file));
}

export function getWorkspacePackages() {
  return collectPackageJsonFiles()
    .map((path) => ({
      path,
      dir: path.replace(/\/package\.json$/, ''),
      packageJson: readJson(path),
    }))
    .filter(
      (entry) =>
        entry.path === 'package.json' ||
        entry.dir === 'cli' ||
        entry.dir.startsWith('packages/') ||
        entry.dir.startsWith('apps/') ||
        entry.dir === 'docs-site',
    );
}
