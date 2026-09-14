#!/usr/bin/env node
// Fact-check the API table of a module document against the code: every route must exist in a routing file.
// Usage: verify-endpoints.mjs <module.md> --repo <backend-repo-dir> [--repo <another>] [--json]
// Reads GFM table rows whose first two cells look like  | GET | `/orders/:id` |  and searches the repos' routing files.
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const md = args[0]; if (!md || !fs.existsSync(md)) { console.error("usage: verify-endpoints.mjs <module.md> --repo <dir> [--repo <dir>] [--json]"); process.exit(1); }
const repos = args.map((a, i) => a === "--repo" ? path.resolve(args[i + 1]) : null).filter(Boolean);
if (!repos.length) { console.error("at least one --repo is required"); process.exit(1); }
const json = args.includes("--json");

// 1. routes from the document
const routes = [];
for (const line of fs.readFileSync(md, "utf8").split("\n")) {
  const m = line.match(/^\|\s*\*{0,2}(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS|ANY|WS)\*{0,2}\s*\|\s*`?([^`|]+?)`?\s*\|/i);
  if (m) routes.push({ method: m[1].toUpperCase(), path: m[2].trim(), line });
}
if (!routes.length) { console.log("no API table rows found (expected rows like `| GET | \\`/orders/:id\\` | …`)"); process.exit(0); }

// 2. routing files: anything that declares routes in the frameworks we know
const ROUTING = /@(Get|Post|Put|Patch|Delete|Controller|All|WebSocketGateway|SubscribeMessage)\(|router\.(get|post|put|patch|delete|all|use)\(|app\.(get|post|put|patch|delete|use|include_router)\(|Route::(get|post|put|patch|delete|any|resource|apiResource|match)\(|path\(|re_path\(|@(app|router)\.(get|post|put|patch|delete)\(|@api_view|@action\(|resources? :|get ['"]|post ['"]|@(Get|Post|Put|Patch|Delete|Request)Mapping|export (async )?function (GET|POST|PUT|PATCH|DELETE)\b/;
const SKIP = /(^|\/)(node_modules|vendor|dist|build|\.git|\.next|coverage|storage|__pycache__|\.venv|venv)(\/|$)/;
const files = [];
const walk = (d, depth) => { if (depth > 12) return; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (SKIP.test(p)) continue; if (e.isDirectory()) walk(p, depth + 1); else if (/\.(ts|tsx|js|mjs|cjs|py|php|rb|java|kt|go)$/.test(e.name) && !/\.(spec|test)\./.test(e.name)) { let s; try { s = fs.readFileSync(p, "utf8"); } catch { continue; } if (ROUTING.test(s)) files.push({ p, s }); } } };
for (const r of repos) if (fs.existsSync(r)) walk(r, 0);

// 3. match: every static segment of the path must appear in one routing file; params (:id, {id}, <int:id>, [id]) are wildcards
const norm = (p) => p.replace(/^https?:\/\/[^/]+/, "").replace(/\?.*$/, "").split("/").filter(Boolean);
const isParam = (seg) => /^(:|\{|<|\[|\$)/.test(seg) || /^<.*>$/.test(seg);
const results = routes.map(r => {
  const segs = norm(r.path); const statics = segs.filter(s => !isParam(s)); const last = statics[statics.length - 1];
  const hits = files.filter(f => statics.every(s => f.s.includes(s)) && (r.method === "ANY" || new RegExp(`\\b(${r.method.toLowerCase()}|${r.method}|${r.method[0] + r.method.slice(1).toLowerCase()})\\b`).test(f.s)));
  const best = hits.map(f => { const idx = last ? f.s.indexOf(last) : 0; const ln = idx >= 0 ? f.s.slice(0, idx).split("\n").length : null; return { file: path.relative(process.cwd(), f.p), line: ln }; }).slice(0, 3);
  return { method: r.method, path: r.path, status: hits.length ? "found" : "NOT FOUND", where: best };
});
if (json) { console.log(JSON.stringify({ routingFiles: files.length, results }, null, 2)); process.exit(results.some(r => r.status !== "found") ? 2 : 0); }
console.log(`Routing files scanned: ${files.length} in ${repos.length} repo(s)\n`);
for (const r of results) console.log(`${r.status === "found" ? "ok       " : "NOT FOUND"}  ${r.method.padEnd(6)} ${r.path}${r.where.length ? `  → ${r.where.map(w => `${w.file}${w.line ? ":" + w.line : ""}`).join(", ")}` : ""}`);
const missing = results.filter(r => r.status !== "found").length;
console.log(`\n${results.length - missing}/${results.length} routes verified${missing ? ` — ${missing} NOT FOUND: fix the table or find the real route before shipping` : ""}`);
process.exit(missing ? 2 : 0);
