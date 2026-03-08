#!/usr/bin/env node
/**
 * BLOODLINE Recursive Scanner
 * Scans the codebase for errors, inconsistencies, and mismatches.
 * Run: tsx scripts/scan.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const WORKSPACE = path.resolve(__dirname, '..');
const REPORT_PATH = path.join(WORKSPACE, 'scan-report.md');

interface Issue {
  check: number;
  severity: 'CRITICAL' | 'ERROR' | 'WARNING';
  message: string;
  file?: string;
  line?: number;
}

const criticals: Issue[] = [];
const errors: Issue[] = [];
const warnings: Issue[] = [];

function add(severity: 'CRITICAL' | 'ERROR' | 'WARNING', check: number, message: string, file?: string, line?: number) {
  const issue: Issue = { check, severity, message, file, line };
  if (severity === 'CRITICAL') criticals.push(issue);
  else if (severity === 'ERROR') errors.push(issue);
  else warnings.push(issue);
}

/** Recursively find all files matching a pattern */
function findFiles(dir: string, ext: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!['node_modules', '.git', 'dist', '.next'].includes(e.name)) {
        findFiles(full, ext, out);
      }
    } else if (e.name.endsWith(ext)) {
      out.push(full);
    }
  }
  return out;
}

/** Find all Dockerfiles */
function findDockerfiles(): string[] {
  const out: string[] = [];
  function walk(d: string) {
    if (!fs.existsSync(d)) return;
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory() && !['node_modules', '.git'].includes(e.name)) {
        walk(full);
      } else if (e.name === 'Dockerfile' || e.name.startsWith('Dockerfile.')) {
        out.push(full);
      }
    }
  }
  walk(WORKSPACE);
  return out;
}

const startTime = Date.now();

function countScannedFiles(): number {
  const ts = [...findFiles(path.join(WORKSPACE, 'apps'), '.ts'), ...findFiles(path.join(WORKSPACE, 'packages'), '.ts')];
  const tsx = findFiles(path.join(WORKSPACE, 'apps'), '.tsx');
  return new Set([...ts, ...tsx]).size;
}

// ─── CHECK 1: ENV VAR COVERAGE ─────────────────────────────────────────────
function checkEnvVarCoverage() {
  const envExamplePath = path.join(WORKSPACE, '.env.example');
  if (!fs.existsSync(envExamplePath)) {
    add('ERROR', 1, '.env.example not found');
    return;
  }

  const content = fs.readFileSync(envExamplePath, 'utf-8');
  const envVars = new Set<string>();
  for (const line of content.split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=/);
    if (m) envVars.add(m[1]);
  }

  const usedInCode = new Set<string>();
  const tsFiles = [...findFiles(path.join(WORKSPACE, 'apps'), '.ts'), ...findFiles(path.join(WORKSPACE, 'packages'), '.ts')];

  for (const file of tsFiles) {
    const text = fs.readFileSync(file, 'utf-8');
    const matches = text.matchAll(/process\.env\.([A-Za-z_][A-Za-z0-9_]*)/g);
    for (const m of matches) usedInCode.add(m[1]);
  }

  for (const v of usedInCode) {
    if (!envVars.has(v)) {
      add('ERROR', 1, `process.env.${v} used in code but missing from .env.example`);
    }
  }

  for (const v of envVars) {
    if (!usedInCode.has(v)) {
      add('WARNING', 1, `Variable ${v} in .env.example never used in code`);
    }
  }
}

// ─── CHECK 2: ROUTE ↔ SERVICE CONSISTENCY ───────────────────────────────────
function checkRouteConsistency() {
  const routesDir = path.join(WORKSPACE, 'apps/api/src/routes');
  if (!fs.existsSync(routesDir)) {
    add('ERROR', 2, 'apps/api/src/routes/ not found');
    return;
  }

  let routeCount = 0;
  const routeFiles = fs.readdirSync(routesDir).filter((f) => f.endsWith('.ts'));

  for (const file of routeFiles) {
    const text = fs.readFileSync(path.join(routesDir, file), 'utf-8');
    const matches = text.matchAll(/(?:router|agentsRouter|authRouter|bountiesRouter|bscoreRouter|socialRouter|lineageRouter)\.(get|post|patch|put|delete)\s*\(/g);
    for (const _ of matches) routeCount++;
  }

  add('WARNING', 2, `Total routes: ${routeCount} (summary)`);
}

// ─── CHECK 3: IMPORT PATH VALIDATION ─────────────────────────────────────────
function checkImportPaths() {
  const tsFiles = findFiles(path.join(WORKSPACE, 'apps'), '.ts');
  const tsxFiles = findFiles(path.join(WORKSPACE, 'apps'), '.tsx');
  const pkgTsFiles = findFiles(path.join(WORKSPACE, 'packages'), '.ts');
  const allTs = [...tsFiles, ...tsxFiles, ...pkgTsFiles];

  const importRegex = /from\s+['"](\.\.?\/[^'"]+)['"]|import\s+['"](\.\.?\/[^'"]+)['"]/g;

  for (const file of allTs) {
    const text = fs.readFileSync(file, 'utf-8');
    const dir = path.dirname(file);

    let m: RegExpExecArray | null;
    importRegex.lastIndex = 0;
    while ((m = importRegex.exec(text)) !== null) {
      const importPath = m[1] ?? m[2];
      if (!importPath) continue;

      const candidates = [
        path.resolve(dir, importPath),
        path.resolve(dir, importPath + '.ts'),
        path.resolve(dir, importPath + '.tsx'),
        path.resolve(dir, importPath + '/index.ts'),
        path.resolve(dir, importPath + '/index.tsx'),
      ];

      const exists = candidates.some((c) => fs.existsSync(c));
      if (!exists) {
        add('ERROR', 3, `Unresolvable import: ${importPath}`, file);
      }
    }
  }
}

// ─── CHECK 4: TYPE ASSERTION AUDIT ────────────────────────────────────────────
function checkTypeAssertions() {
  const tsFiles = [...findFiles(path.join(WORKSPACE, 'apps'), '.ts'), ...findFiles(path.join(WORKSPACE, 'packages'), '.ts')];
  const tsxFiles = findFiles(path.join(WORKSPACE, 'apps'), '.tsx');
  const allTs = [...tsFiles, ...tsxFiles];

  const assertions: { file: string; line: number }[] = [];
  const patterns = [
    { regex: /as\s+any\b/g, name: 'as any' },
    { regex: /as\s+unknown\b/g, name: 'as unknown' },
    { regex: /@ts-ignore/g, name: '@ts-ignore' },
    { regex: /@ts-nocheck/g, name: '@ts-nocheck' },
    { regex: /\w+!(?=[.\s,;)\]\}])/g, name: 'non-null assertion' },
  ];

  for (const file of allTs) {
    const text = fs.readFileSync(file, 'utf-8');
    const lines = text.split('\n');

    for (const p of patterns) {
      p.regex.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = p.regex.exec(text)) !== null) {
        const lineNum = text.slice(0, m.index).split('\n').length;
        assertions.push({ file, line: lineNum });
        add('WARNING', 4, `${p.name}: ${path.relative(WORKSPACE, file)}:${lineNum}`, file, lineNum);
      }
    }
  }

  if (assertions.length > 10) {
    add('ERROR', 4, `More than 10 type assertions (${assertions.length} total)`);
  }
}

// ─── CHECK 5: HARDCODED VALUES AUDIT ────────────────────────────────────────
function checkHardcodedValues() {
  const tsFiles = [...findFiles(path.join(WORKSPACE, 'apps'), '.ts'), ...findFiles(path.join(WORKSPACE, 'packages'), '.ts')];
  const tsxFiles = findFiles(path.join(WORKSPACE, 'apps'), '.tsx');
  const allTs = [...tsFiles, ...tsxFiles];

  const privateKeyRegex = /0x[a-fA-F0-9]{64}/;
  const apiKeyRegex = /\bsk-[a-zA-Z0-9]+/; // \b avoids "risk-tolerant" false positive
  const bearerRegex = /Bearer\s+[^\s]+/;

  const testPatterns = [/\.test\.ts$/, /\.spec\.ts$/, /mock\.ts$/, /__tests__/];

  for (const file of allTs) {
    const isTest = testPatterns.some((p) => p.test(file));
    if (isTest) continue;

    const text = fs.readFileSync(file, 'utf-8');
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (privateKeyRegex.test(line)) {
        add('CRITICAL', 5, `Hardcoded private key in ${path.relative(WORKSPACE, file)}:${i + 1}`, file, i + 1);
      }
      if (apiKeyRegex.test(line)) {
        add('CRITICAL', 5, `Hardcoded API key (sk-*) in ${path.relative(WORKSPACE, file)}:${i + 1}`, file, i + 1);
      }
      if (bearerRegex.test(line) && !line.includes('Bearer ${') && !/startsWith\s*\(\s*['"]Bearer\s/.test(line)) {
        add('CRITICAL', 5, `Hardcoded Bearer token in ${path.relative(WORKSPACE, file)}:${i + 1}`, file, i + 1);
      }
    }
  }
}

// ─── CHECK 6: DOCKER IMAGE CONSISTENCY ────────────────────────────────────────
function checkDockerImages() {
  const dockerfiles = findDockerfiles();

  for (const df of dockerfiles) {
    const text = fs.readFileSync(df, 'utf-8');
    const fromMatch = text.match(/^FROM\s+(\S+)/m);
    if (fromMatch) {
      const image = fromMatch[1];
      if (image === 'scratch') continue; // scratch is a special empty base, no version
      if (image.endsWith(':latest') || (!image.includes(':') && !image.includes('@'))) {
        add('WARNING', 6, `Dockerfile uses 'latest' or unpinned base: ${image}`, df);
      }
    }
  }
}

// ─── CHECK 7: AGENT TEMPLATE VALIDITY ────────────────────────────────────────
function checkAgentTemplates() {
  const templatesDir = path.join(WORKSPACE, 'agent-templates');
  if (!fs.existsSync(templatesDir)) {
    add('WARNING', 7, 'agent-templates/ directory does not exist');
    return;
  }

  const required = ['package.json', 'src/index.ts', 'Dockerfile', 'README.md'];
  const dirs = fs.readdirSync(templatesDir, { withFileTypes: true }).filter((e) => e.isDirectory());

  for (const d of dirs) {
    const templatePath = path.join(templatesDir, d.name);
    for (const req of required) {
      const full = path.join(templatePath, req);
      if (!fs.existsSync(full)) {
        add('ERROR', 7, `Missing required file: agent-templates/${d.name}/${req}`);
      }
    }
  }
}

// ─── CHECK 8: SOCIAL POST COVERAGE ───────────────────────────────────────────
function checkSocialPostCoverage() {
  const socialPath = path.join(WORKSPACE, 'apps/api/src/services/social.service.ts');
  if (!fs.existsSync(socialPath)) {
    add('ERROR', 8, 'social.service.ts not found');
    return;
  }

  const requiredTriggers = ['birth', 'near_death', 'death', 'prodigy', 'ascension', 'thrive', 'bounty_won', 'forked', 'saved'];
  const text = fs.readFileSync(socialPath, 'utf-8');

  const handledTriggers: string[] = [];
  const triggerPromptsMatch = text.match(/TRIGGER_PROMPTS:\s*Record<string,\s*string>\s*=\s*\{([^}]+)\}/s);
  if (triggerPromptsMatch) {
    const inner = triggerPromptsMatch[1];
    const keys = inner.match(/(\w+):\s*['"]/g)?.map((k) => k.replace(/:\s*['"]$/, '')) ?? [];
    handledTriggers.push(...keys);
  }

  for (const t of requiredTriggers) {
    if (!handledTriggers.includes(t)) {
      add('ERROR', 8, `Missing required social trigger: ${t}`);
    }
  }
}

// ─── CHECK 9: WEBSOCKET EVENT COVERAGE ───────────────────────────────────────
function checkWebSocketCoverage() {
  const emitted = new Set<string>();
  const listened = new Set<string>();

  const apiTs = findFiles(path.join(WORKSPACE, 'apps/api'), '.ts');
  for (const file of apiTs) {
    const text = fs.readFileSync(file, 'utf-8');
    const emitMatches = text.matchAll(/(?:io|ws)\.(?:to\([^)]+\)\.)?emit\s*\(\s*['"]([^'"]+)['"]/g);
    for (const m of emitMatches) emitted.add(m[1]);
  }

  const sdkTs = findFiles(path.join(WORKSPACE, 'packages/sdk'), '.ts');
  const miniappTs = [...findFiles(path.join(WORKSPACE, 'apps/miniapp'), '.ts'), ...findFiles(path.join(WORKSPACE, 'apps/miniapp'), '.tsx')];

  for (const file of [...sdkTs, ...miniappTs]) {
    const text = fs.readFileSync(file, 'utf-8');
    const onMatches = text.matchAll(/socket\.on\s*\(\s*['"]([^'"]+)['"]/g);
    for (const m of onMatches) listened.add(m[1]);
  }

  for (const ev of emitted) {
    if (!listened.has(ev)) {
      add('WARNING', 9, `Event '${ev}' emitted but not listened for in SDK/miniapp`);
    }
  }
}

// ─── MAIN ───────────────────────────────────────────────────────────────────
function main() {
  checkEnvVarCoverage();
  checkRouteConsistency();
  checkImportPaths();
  checkTypeAssertions();
  checkHardcodedValues();
  checkDockerImages();
  checkAgentTemplates();
  checkSocialPostCoverage();
  checkWebSocketCoverage();

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  const status = criticals.length === 0 && errors.length === 0 ? 'PASS' : 'FAIL';
  const filesScanned = countScannedFiles();

  const report = [
    '╔══════════════════════════════════════════════════════╗',
    '║  BLOODLINE RECURSIVE SCAN REPORT                    ║',
    `║  Run at: ${new Date().toISOString()}                    ║`,
    '╚══════════════════════════════════════════════════════╝',
    '',
    `CRITICAL  ${criticals.length}`,
    `ERROR     ${errors.length}`,
    `WARNING   ${warnings.length}`,
    '',
    '─── CRITICAL ─────────────────────────────────────',
    ...criticals.map((i) => `[CHECK ${i.check}] ${i.message}${i.file ? ` (${path.relative(WORKSPACE, i.file)}${i.line ? `:${i.line}` : ''})` : ''}`),
    criticals.length === 0 ? '(none)' : '',
    '',
    '─── ERRORS ───────────────────────────────────────',
    ...errors.map((i) => `[CHECK ${i.check}] ${i.message}${i.file ? ` (${path.relative(WORKSPACE, i.file)}${i.line ? `:${i.line}` : ''})` : ''}`),
    errors.length === 0 ? '(none)' : '',
    '',
    '─── WARNINGS ──────────────────────────────────────',
    ...warnings.map((i) => `[CHECK ${i.check}] ${i.message}${i.file ? ` (${path.relative(WORKSPACE, i.file)}${i.line ? `:${i.line}` : ''})` : ''}`),
    warnings.length === 0 ? '(none)' : '',
    '',
    '─── SUMMARY ──────────────────────────────────────',
    `Files scanned: ${filesScanned}`,
    'Checks run: 9',
    `Duration: ${duration}s`,
    `Status: ${status}`,
  ].join('\n');

  const mdReport = [
    '# BLOODLINE Recursive Scan Report',
    '',
    `**Run at:** ${new Date().toISOString()}`,
    '',
    '| Severity | Count |',
    '|----------|-------|',
    `| CRITICAL | ${criticals.length} |`,
    `| ERROR | ${errors.length} |`,
    `| WARNING | ${warnings.length} |`,
    '',
    '## CRITICAL',
    criticals.length === 0 ? '(none)' : '',
    ...criticals.map((i) => `- [CHECK ${i.check}] ${i.message}`),
    '',
    '## ERRORS',
    errors.length === 0 ? '(none)' : '',
    ...errors.map((i) => `- [CHECK ${i.check}] ${i.message}`),
    '',
    '## WARNINGS',
    warnings.length === 0 ? '(none)' : '',
    ...warnings.map((i) => `- [CHECK ${i.check}] ${i.message}`),
    '',
    '## Summary',
    `- Files scanned: ${filesScanned}`,
    '- Checks run: 9',
    `- Duration: ${duration}s`,
    `- Status: ${status}`,
  ].join('\n');

  console.log(report);
  fs.writeFileSync(REPORT_PATH, mdReport);

  process.exit(criticals.length > 0 || errors.length > 0 ? 1 : 0);
}

main();
