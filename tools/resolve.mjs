#!/usr/bin/env node
// Resolve an assess target that may be a path, a repo name, an alias, or an
// existing assessment slug.
//
//   node tools/resolve.mjs --target server
//   node tools/resolve.mjs --target D:/repos/novello/server
//   node tools/resolve.mjs --list
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cfgPath = path.join(ROOT, 'config', 'workspaces.json');
const cfg = fs.existsSync(cfgPath)
  ? JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
  : { roots: [], aliases: {}, ignore: [] };
const IGNORE = new Set(cfg.ignore ?? []);

const isDir = (p) => {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
};

/** Does this directory look like a source repository rather than a container? */
function looksLikeRepo(dir) {
  const markers = [
    'package.json', 'go.mod', 'pom.xml', 'build.gradle', 'build.gradle.kts',
    'composer.json', 'pyproject.toml', 'requirements.txt', 'Gemfile',
    'Cargo.toml', 'pubspec.yaml', '.git',
  ];
  return markers.some((f) => fs.existsSync(path.join(dir, f)));
}

/** Every candidate repo under the configured roots, one and two levels deep. */
export function listRepos() {
  const out = new Map();
  const add = (dir) => {
    if (!isDir(dir) || IGNORE.has(path.basename(dir))) return;
    if (looksLikeRepo(dir) && !out.has(dir)) out.set(dir, path.basename(dir));
  };
  for (const root of cfg.roots ?? []) {
    if (!isDir(root)) continue;
    for (const e of fs.readdirSync(root, { withFileTypes: true })) {
      if (!e.isDirectory() || IGNORE.has(e.name)) continue;
      const lvl1 = path.join(root, e.name);
      if (looksLikeRepo(lvl1)) {
        // A repo is a leaf — do not descend, or sub-projects such as the
        // android/ and ios/ folders of a React Native app appear as repos.
        add(lvl1);
        continue;
      }
      // A container directory: look one level deeper for the repos inside it.
      for (const e2 of fs.readdirSync(lvl1, { withFileTypes: true })) {
        if (!e2.isDirectory() || IGNORE.has(e2.name)) continue;
        add(path.join(lvl1, e2.name));
      }
    }
  }
  return [...out.entries()].map(([dir, name]) => ({ name, dir }));
}

/** Existing assessment files, by slug. */
export function listAssessments() {
  const dir = path.join(ROOT, 'assessments');
  if (!isDir(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.assessment.json'))
    .map((f) => {
      const file = path.join(dir, f);
      let meta = {};
      try {
        meta = JSON.parse(fs.readFileSync(file, 'utf8')).meta ?? {};
      } catch {
        /* unreadable file is still listable by slug */
      }
      return { slug: f.replace('.assessment.json', ''), file, app: meta.app, product: meta.productName };
    });
}

/**
 * Resolve a target string.
 * Returns { kind: 'repo'|'assessment'|'ambiguous'|'unknown', ... }
 */
/**
 * @param target  path, repo name, alias, or assessment slug
 * @param prefer  which kind wins a partial-match tie: 'repo' (for /assess) or
 *                'assessment' (for /assess-report). Exact matches always win first.
 */
export function resolve(target, prefer = 'repo') {
  if (!target) return { kind: 'unknown', reason: 'no target given' };
  const raw = String(target).trim().replace(/^["']|["']$/g, '');

  // 1. A real path wins outright.
  const asPath = path.resolve(raw);
  if (isDir(asPath)) return { kind: 'repo', dir: asPath, name: path.basename(asPath), via: 'path' };

  const key = raw.toLowerCase();

  // 2. Configured alias.
  for (const [alias, dir] of Object.entries(cfg.aliases ?? {})) {
    if (alias.toLowerCase() === key && isDir(dir)) {
      return { kind: 'repo', dir: path.resolve(dir), name: path.basename(dir), via: `alias "${alias}"` };
    }
  }

  const assessments = listAssessments();
  const repos = listRepos();
  const aExact = assessments.filter((a) => a.slug.toLowerCase() === key || a.app?.toLowerCase() === key);
  const rExact = repos.filter((r) => r.name.toLowerCase() === key);
  const aFuzzy = assessments.filter((a) => a.slug.toLowerCase().includes(key));
  const rFuzzy = repos.filter((r) => r.name.toLowerCase().includes(key));

  const repoHit = (list, via) =>
    list.length === 1
      ? { kind: 'repo', ...list[0], via }
      : { kind: 'ambiguous', matches: list, reason: `"${raw}" matches ${list.length} repos` };
  const assessHit = (list, via) =>
    list.length === 1
      ? { kind: 'assessment', ...list[0], via }
      : {
          kind: 'ambiguous',
          matches: list.map((a) => ({ name: a.slug, dir: a.file })),
          reason: `"${raw}" matches ${list.length} assessments`,
        };

  // 3. The preferred kind is exhausted first — exact then partial — before the
  //    other kind is considered at all. `/assess-report server` should find the
  //    novello-server assessment, not the repo, since repos mean nothing to it.
  const order =
    prefer === 'assessment'
      ? [
          [aExact, assessHit, 'assessment slug'],
          [aFuzzy, assessHit, 'assessment slug (partial)'],
          [rExact, repoHit, 'repo name'],
          [rFuzzy, repoHit, 'repo name (partial)'],
        ]
      : [
          [rExact, repoHit, 'repo name'],
          [rFuzzy, repoHit, 'repo name (partial)'],
          [aExact, assessHit, 'assessment slug'],
          [aFuzzy, assessHit, 'assessment slug (partial)'],
        ];
  for (const [list, hit, via] of order) if (list.length) return hit(list, via);

  return { kind: 'unknown', reason: `nothing named "${raw}" under the configured roots`, repos, assessments };
}

// ── CLI ─────────────────────────────────────────────────────────────────────
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = {};
  for (let i = 2; i < process.argv.length; i++) {
    const a = process.argv[i];
    if (a.startsWith('--')) {
      const next = process.argv[i + 1];
      if (next && !next.startsWith('--')) { args[a.slice(2)] = next; i++; }
      else args[a.slice(2)] = true;
    } else if (!args.target) args.target = a;
  }

  if (args.list || !args.target) {
    const repos = listRepos();
    const assessments = listAssessments();
    console.log(`\nRepositories (${repos.length}) — usable as /assess <name>:`);
    for (const r of repos) console.log(`  ${r.name.padEnd(24)} ${r.dir}`);
    if (Object.keys(cfg.aliases ?? {}).length) {
      console.log(`\nAliases:`);
      for (const [k, v] of Object.entries(cfg.aliases)) console.log(`  ${k.padEnd(24)} ${v}`);
    }
    console.log(`\nExisting assessments (${assessments.length}) — usable as /assess-report <slug>:`);
    for (const a of assessments) console.log(`  ${a.slug.padEnd(24)} ${a.product ?? ''}`);
    console.log('');
    process.exit(0);
  }

  const r = resolve(args.target, args.prefer === 'assessment' ? 'assessment' : 'repo');
  if (r.kind === 'repo') {
    console.log(`repo        ${r.dir}`);
    console.log(`name        ${r.name}`);
    console.log(`resolved by ${r.via}`);
    const existing = listAssessments().find((a) => a.slug.endsWith(r.name) || a.app?.endsWith(r.name));
    if (existing) console.log(`note        an assessment already exists: ${existing.slug} (re-assessing will overwrite it)`);
  } else if (r.kind === 'assessment') {
    console.log(`assessment  ${r.file}`);
    console.log(`slug        ${r.slug}`);
    console.log(`resolved by ${r.via}`);
  } else if (r.kind === 'ambiguous') {
    console.error(`ambiguous: ${r.reason}`);
    for (const m of r.matches) console.error(`  ${m.name.padEnd(24)} ${m.dir}`);
    process.exit(2);
  } else {
    console.error(`unresolved: ${r.reason}`);
    console.error(`\nRun 'npm run targets' to list what is available.`);
    process.exit(1);
  }
}
