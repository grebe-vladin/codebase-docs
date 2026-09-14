#!/usr/bin/env node
// List existing module docs and whether the code they cover changed since they were generated.
// Usage: check-stale.mjs <docs-dir> <root-dir> [--json]
// Stamp (line 1 of each <docs-dir>/*/*.md): <!-- codebase-docs {"module","repos":{"<repo>":{"sha","paths":[..]}},"dirty":["<repo>"]} -->
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const [docsDir, root] = process.argv.slice(2);
if (!docsDir || !root) { console.error("usage: check-stale.mjs <docs-dir> <root-dir> [--json]"); process.exit(1); }
const json = process.argv.includes("--json");
const git = (repo, a) => execFileSync("git", ["-C", path.join(root, repo), ...a], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
const results = [];
if (fs.existsSync(docsDir)) for (const d of fs.readdirSync(docsDir, { withFileTypes: true })) {
  if (!d.isDirectory()) continue;
  for (const f of fs.readdirSync(path.join(docsDir, d.name))) {
    if (!f.endsWith(".md")) continue;
    const file = path.join(docsDir, d.name, f);
    const m = fs.readFileSync(file, "utf8").match(/<!--\s*codebase-docs\s+(\{[\s\S]*?\})\s*-->/);
    if (!m) { results.push({ module: d.name, file, status: "unstamped" }); continue; }
    let stamp; try { stamp = JSON.parse(m[1]); } catch { results.push({ module: d.name, file, status: "bad-stamp", reason: "invalid JSON" }); continue; }
    const repos = Object.entries(stamp.repos || {});
    const bad = !repos.length ? "no repos" : repos.find(([r, v]) => !/^[0-9a-f]{7,40}$/i.test(v?.sha || "") || !Array.isArray(v?.paths) || !v.paths.length);
    if (bad) { results.push({ module: stamp.module || d.name, file, status: "bad-stamp", reason: typeof bad === "string" ? bad : `repo "${bad[0]}" lacks a valid sha or paths` }); continue; }
    const changes = [];
    for (const [repo, v] of repos) {
      let head; try { head = git(repo, ["rev-parse", "HEAD"]); } catch { changes.push({ repo, error: "not a git repo or missing" }); continue; }
      let committed = [];
      if (head !== v.sha) { try { committed = git(repo, ["diff", "--name-only", v.sha, "HEAD", "--", ...v.paths]).split("\n").filter(Boolean); }
        catch { changes.push({ repo, error: `stamped commit ${v.sha.slice(0, 10)} not found (rebased? fetch?)` }); continue; } }
      let dirty = []; try { dirty = git(repo, ["status", "--porcelain", "--untracked-files=all", "--", ...v.paths]).split("\n").filter(Boolean).map(l => l.slice(3)); } catch {}
      if (committed.length || dirty.length) changes.push({ repo, from: v.sha.slice(0, 10), to: head.slice(0, 10), files: committed, uncommitted: dirty });
    }
    results.push({ module: stamp.module || d.name, file, status: changes.length ? "stale" : "fresh", generated: stamp.generated, generatedDirty: stamp.dirty || [], changes });
  }
}
if (json) console.log(JSON.stringify(results, null, 2));
else if (!results.length) console.log("no existing docs");
else for (const r of results) {
  const det = (r.changes || []).map(c => c.error ? `${c.repo}: ${c.error}` : `${c.repo}: ${c.files.length} committed (${c.from}..${c.to})${c.uncommitted.length ? `, ${c.uncommitted.length} uncommitted` : ""}`).join("; ");
  const gd = r.generatedDirty?.length ? ` [generated from a dirty tree: ${r.generatedDirty.join(", ")}]` : "";
  console.log(`${r.status.toUpperCase()}\t${r.module}\t${r.file}${det ? `\t${det}` : ""}${r.reason ? `\t${r.reason}` : ""}${gd}`);
}
