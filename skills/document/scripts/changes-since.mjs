#!/usr/bin/env node
// Raw material for the "What changed" section of an updated document.
// Usage: changes-since.mjs <module.md> <root-dir> [--json]
// Uses the stamp (repo sha + paths): commits, changed files, and route/entity/env-key lines added or removed since then.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const [md, root] = process.argv.slice(2);
if (!md || !root) { console.error("usage: changes-since.mjs <module.md> <root-dir> [--json]"); process.exit(1); }
const json = process.argv.includes("--json");
const m = fs.readFileSync(md, "utf8").match(/<!--\s*codebase-docs\s+(\{[\s\S]*?\})\s*-->/);
if (!m) { console.error("no stamp in the document — nothing to diff against"); process.exit(2); }
const stamp = JSON.parse(m[1]);
const git = (repo, a) => { try { return execFileSync("git", ["-C", path.join(root, repo), ...a], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); } catch { return null; } };
const INTERESTING = /@(Get|Post|Put|Patch|Delete|Controller|Cron|Process|Entity|Column|Injectable|Module)\(|Route::|router\.|app\.(get|post|put|patch|delete)|process\.env\.[A-Z_]+|ConfigService\.get\(|env\(['"]|os\.environ|@(Entity|Table)|class \w+ extends Model|CREATE TABLE|ALTER TABLE|export (const|function|class) |def (get|post|put|patch|delete)_|useQuery|useMutation|fetch\(|axios\./;
const out = { module: stamp.module, generated: stamp.generated, repos: {} };
for (const [repo, v] of Object.entries(stamp.repos || {})) {
  const head = git(repo, ["rev-parse", "HEAD"]); if (!head) { out.repos[repo] = { error: "not a git repo" }; continue; }
  const r = { from: v.sha.slice(0, 10), to: head.slice(0, 10), commits: [], files: [], uncommitted: [], lines: { added: [], removed: [] } };
  if (head !== v.sha) {
    r.commits = (git(repo, ["log", "--oneline", "--no-merges", `${v.sha}..HEAD`, "--", ...v.paths]) || "").split("\n").filter(Boolean).slice(0, 50);
    r.files = (git(repo, ["diff", "--name-status", v.sha, "HEAD", "--", ...v.paths]) || "").split("\n").filter(Boolean).map(l => { const [st, ...f] = l.split("\t"); return { status: st[0], file: f.join("\t") }; });
    const diff = git(repo, ["diff", "--unified=0", v.sha, "HEAD", "--", ...v.paths]) || "";
    let file = "";
    for (const l of diff.split("\n")) { if (l.startsWith("+++ b/")) file = l.slice(6); else if (/^[+-](?![+-])/.test(l) && INTERESTING.test(l)) (l[0] === "+" ? r.lines.added : r.lines.removed).push(`${file}: ${l.slice(1).trim().slice(0, 140)}`); }
    r.lines.added = r.lines.added.slice(0, 80); r.lines.removed = r.lines.removed.slice(0, 80);
  }
  r.uncommitted = (git(repo, ["status", "--porcelain", "--untracked-files=all", "--", ...v.paths]) || "").split("\n").filter(Boolean).map(l => l.slice(3));
  out.repos[repo] = r;
}
if (json) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }
console.log(`# Changes since the ${stamp.module} document of ${stamp.generated}\n`);
for (const [repo, r] of Object.entries(out.repos)) {
  if (r.error) { console.log(`## ${repo}: ${r.error}\n`); continue; }
  console.log(`## ${repo} (${r.from} → ${r.to})\n`);
  if (!r.commits.length && !r.uncommitted.length) { console.log("No changes in the covered paths.\n"); continue; }
  if (r.commits.length) console.log(`Commits (${r.commits.length}):\n${r.commits.map(c => `- ${c}`).join("\n")}\n`);
  if (r.files.length) console.log(`Files (${r.files.length}):\n${r.files.map(f => `- ${f.status} ${f.file}`).join("\n")}\n`);
  if (r.lines.added.length) console.log(`Routes / entities / config added:\n${r.lines.added.map(l => `+ ${l}`).join("\n")}\n`);
  if (r.lines.removed.length) console.log(`Removed:\n${r.lines.removed.map(l => `- ${l}`).join("\n")}\n`);
  if (r.uncommitted.length) console.log(`Uncommitted (${r.uncommitted.length}): ${r.uncommitted.join(", ")}\n`);
}
