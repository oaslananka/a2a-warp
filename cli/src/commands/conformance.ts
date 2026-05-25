import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { Command } from 'commander';
import {
  hasRequiredConformanceFailures,
  parseConformanceProtocolVersion,
  runConformanceSuite,
  type ConformanceCaseResult,
  type ConformanceReport,
} from '@oaslananka/a2a-warp-testing';
import {
  emitResult,
  withSpinner,
  writeError,
  type CliOptions,
  type RootOptionsProvider,
} from '../io.js';
import { addNetworkOptions, createA2AClient, type NetworkCommandOptions } from '../network.js';
import { CLI_VERSION } from '../version.js';

interface ConformanceCommandOptions extends NetworkCommandOptions {
  protocolVersion?: string;
  json?: boolean;
  junit?: string;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function escapeXml(value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function renderJUnitCase(testCase: ConformanceCaseResult): string {
  const base = `  <testcase name="${escapeXml(
    testCase.id,
  )}" classname="a2a-warp.conformance" time="${(testCase.durationMs / 1000).toFixed(3)}">`;

  if (testCase.status === 'fail') {
    const message = testCase.message ?? 'Conformance case failed';
    return [
      base,
      `    <failure message="${escapeXml(message)}" type="ConformanceFailure">${escapeXml(
        message,
      )}</failure>`,
      '  </testcase>',
    ].join('\n');
  }

  if (testCase.status === 'skip') {
    return [
      base,
      `    <skipped message="${escapeXml(testCase.message ?? 'Skipped')}" />`,
      '  </testcase>',
    ].join('\n');
  }

  return `  <testcase name="${escapeXml(
    testCase.id,
  )}" classname="a2a-warp.conformance" time="${(testCase.durationMs / 1000).toFixed(3)}" />`;
}

function renderConformanceJUnit(report: ConformanceReport): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<testsuite name="a2a-warp-conformance" tests="${report.summary.total}" failures="${report.summary.failed}" skipped="${report.summary.skipped}" time="${(
      report.summary.durationMs / 1000
    ).toFixed(3)}">`,
    '  <properties>',
    `    <property name="endpoint" value="${escapeXml(report.endpoint.url)}" />`,
    `    <property name="protocolVersion" value="${escapeXml(report.protocolVersion)}" />`,
    `    <property name="packageVersion" value="${escapeXml(report.package.version)}" />`,
    '  </properties>',
    ...report.cases.map(renderJUnitCase),
    '</testsuite>',
    '',
  ].join('\n');
}

function writeJUnitReport(path: string, report: ConformanceReport): void {
  const targetPath = resolve(path);
  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, renderConformanceJUnit(report), 'utf8');
}

function mergeCliOptions(
  rootOptions: CliOptions,
  commandOptions: ConformanceCommandOptions,
): CliOptions {
  return { json: Boolean(rootOptions.json || commandOptions.json) };
}

export function createConformanceCommand(getOptions: RootOptionsProvider): Command {
  const command = addNetworkOptions(
    new Command('conformance')
      .argument('<url>')
      .option('--protocol-version <version>', 'Protocol fixture version to run: 1.0 or 1.2', '1.2')
      .option('--json', 'Machine-readable JSON output')
      .option('--junit <path>', 'Write a JUnit XML report to a path'),
  );

  return command.action(
    async (url: string, commandOptions: ConformanceCommandOptions, actionCommand: Command) => {
      const mergedCommandOptions = actionCommand.optsWithGlobals<ConformanceCommandOptions>();
      const outputOptions = mergeCliOptions(getOptions(), mergedCommandOptions);

      try {
        const protocolVersion = parseConformanceProtocolVersion(
          mergedCommandOptions.protocolVersion ?? '1.2',
        );
        const client = createA2AClient(url, mergedCommandOptions);
        const report = await withSpinner('Running conformance suite', outputOptions, () =>
          runConformanceSuite({
            client,
            endpointUrl: url,
            packageVersion: CLI_VERSION,
            protocolVersion,
          }),
        );

        if (mergedCommandOptions.junit) {
          writeJUnitReport(mergedCommandOptions.junit, report);
        }

        emitResult(report, outputOptions);
        if (hasRequiredConformanceFailures(report)) {
          process.exitCode = 1;
        }
      } catch (error) {
        writeError(`Conformance failed: ${errorMessage(error)}`);
        process.exitCode = 1;
      }
    },
  );
}
