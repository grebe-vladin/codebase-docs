#!/usr/bin/env node
// Dependency report for the packages a set of files actually imports — JavaScript/TypeScript (npm), PHP (composer), Python (pip).
// Usage: deps-report.mjs --repo <repo-dir> --files <f1> <f2> ... | --files-from <list.txt> [--no-registry] [--no-audit] [--no-cache] [--json]
// Output: Markdown table (Package | Used by | Declared | Installed | Latest | Installed age | License | Status | Advisory) + audit note.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";
import { builtinModules } from "node:module";
const run = promisify(execFile);

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i === -1 ? d : args[i + 1]; };
const has = (k) => args.includes(`--${k}`);
const repo = path.resolve(opt("repo", "."));
let files = [];
const fi = args.indexOf("--files");
if (fi !== -1) for (let i = fi + 1; i < args.length && !args[i].startsWith("--"); i++) files.push(args[i]);
if (opt("files-from")) files.push(...fs.readFileSync(opt("files-from"), "utf8").split("\n").map(s => s.trim()).filter(Boolean));
files = files.map(f => path.resolve(repo, f)).filter(f => fs.existsSync(f) && fs.statSync(f).isFile());
if (!files.length) { console.error("no files. usage: deps-report.mjs --repo <dir> --files a.ts b.php c.py ... [--files-from list] [--no-registry] [--no-audit] [--no-cache] [--json]"); process.exit(1); }
const ancestors = []; { let d = repo; for (let i = 0; i < 6; i++) { ancestors.push(d); const up = path.dirname(d); if (up === d) break; d = up; } }
const findUp = (names) => { for (const d of ancestors) for (const n of names) if (fs.existsSync(path.join(d, n))) return { dir: d, name: n }; return null; };
const readJson = (f) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return null; } };
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:\\'"])\/\/[^\n]*/g, "$1").replace(/(^|\n)\s*#[^\n]*/g, "$1");

// ---------- registry cache (24 h) at ~/.codebase-docs/cache/registry.json
const CACHE_FILE = path.join(os.homedir(), ".codebase-docs", "cache", "registry.json"); const TTL = 24 * 3600 * 1000;
const cache = has("no-cache") ? {} : (readJson(CACHE_FILE) || {}); let cacheDirty = false;
const cached = async (key, fn) => { const c = cache[key]; if (c && Date.now() - c.at < TTL) return c.v; const v = await fn(); cache[key] = { at: Date.now(), v }; cacheDirty = true; return v; };
const saveCache = () => { if (!cacheDirty || has("no-cache")) return; fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true }); fs.writeFileSync(CACHE_FILE, JSON.stringify(cache)); };
const fetchJson = async (url) => { const r = await fetch(url, { headers: { "user-agent": "codebase-docs deps-report" } }); if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`); return r.json(); };

// ---------- adapters: each returns rows [{name, files, declared, kind, installed, locked, resolved}] and lookups
const adapters = {};

adapters.js = {
  label: "npm", match: (f) => /\.(m?[jt]sx?|cjs|vue|svelte)$/.test(f),
  collect(fileList) {
    const LOCKS = ["pnpm-lock.yaml", "yarn.lock", "package-lock.json", "npm-shrinkwrap.json", "bun.lock", "bun.lockb"];
    const lock = findUp(LOCKS); const declared = {};
    for (const d of ancestors) { const j = readJson(path.join(d, "package.json")); if (!j) continue; for (const k of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) for (const [n, v] of Object.entries(j[k] || {})) declared[n] ??= { range: v, kind: k }; }
    const builtins = new Set(builtinModules.concat(builtinModules.map(b => `node:${b}`)));
    const pkgName = (spec) => { if (spec.startsWith("node:") || builtins.has(spec)) return null; if (/^[./~#]/.test(spec) || spec.startsWith("@/") || spec.startsWith("src/")) return null; const p = spec.split("/"); return spec.startsWith("@") ? (p.length >= 2 ? p.slice(0, 2).join("/") : null) : p[0]; };
    const usage = new Map();
    for (const f of fileList) { const src = stripComments(fs.readFileSync(f, "utf8")); const re = /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*|\bexport\s+\*\s+from\s*|\bexport\s+\{[^}]*\}\s+from\s*)['"]([^'"\n]+)['"]/g; let m;
      while ((m = re.exec(src))) { const n = pkgName(m[1]); if (!n) continue; (usage.get(n) || usage.set(n, new Set()).get(n)).add(path.relative(repo, f)); } }
    const installed = (n) => { for (const d of ancestors) { const j = readJson(path.join(d, "node_modules", n, "package.json")); if (j) return j.version; } return null; };
    let lockText = null; const locked = (n) => { if (!lock) return null; if (lockText === null) { try { lockText = fs.readFileSync(path.join(lock.dir, lock.name), "utf8"); } catch { lockText = ""; } } const esc = n.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
      try { if (/package-lock|shrinkwrap/.test(lock.name)) { const j = JSON.parse(lockText); const k = Object.keys(j.packages || {}).find(k => k.endsWith(`node_modules/${n}`)); return k ? j.packages[k].version : j.dependencies?.[n]?.version || null; }
        if (lock.name === "yarn.lock") { const m = lockText.match(new RegExp(`^"?${esc}@[^\\n]*:\\n(?:[^\\n]*\\n)*?\\s+version:? "?([^"\\n]+)"?`, "m")); return m ? m[1] : null; }
        if (lock.name === "pnpm-lock.yaml") { const m = lockText.match(new RegExp(`^\\s*/?${esc}@([0-9][^\\s(:'"]*)`, "m")); return m ? m[1] : null; } } catch {} return null; };
    const rows = [...usage.keys()].sort().map(n => { const inst = installed(n), lk = inst ? null : locked(n); return { name: n, files: [...usage.get(n)], declared: declared[n]?.range || null, kind: declared[n]?.kind || (inst || lk ? "transitive" : "unresolved"), installed: inst, locked: lk, resolved: !!(declared[n] || inst || lk) }; });
    return { rows, lock };
  },
  async registry(r) { const j = await cached(`npm:${r.name}`, async () => { const { stdout } = await run("npm", ["view", r.name, "version", "time", "license", "deprecated", "--json"], { timeout: 25000 }); return JSON.parse(stdout); });
    r.latest = j.version; r.latestDate = j.time?.[j.version]?.slice(0, 10); const v = r.installed || r.locked; r.installedDate = v ? j.time?.[v]?.slice(0, 10) : null; r.license = typeof j.license === "string" ? j.license : j.license?.type || null; r.deprecated = j.deprecated ? String(j.deprecated).slice(0, 80) : null; },
  async audit(ctx) { const lock = ctx.lock; const cwd = lock?.dir || repo; let cmd, scope;
    if (lock?.name === "pnpm-lock.yaml") { cmd = ["pnpm", ["audit", "--json"]]; scope = "pnpm workspace tree"; }
    else if (lock?.name === "yarn.lock") { let classic = true; try { const { stdout } = await run("yarn", ["--version"], { cwd, timeout: 15000 }); classic = stdout.trim().startsWith("1."); } catch {} cmd = classic ? ["yarn", ["audit", "--json"]] : ["yarn", ["npm", "audit", "--all", "--recursive", "--json"]]; scope = classic ? "yarn classic, whole tree" : "yarn berry, all workspaces"; }
    else if (lock?.name?.startsWith("bun")) { cmd = ["bun", ["audit", "--json"]]; scope = "bun tree"; }
    else { cmd = ["npm", ["audit", "--json"]]; scope = lock ? "npm whole tree" : "npm (no lockfile)"; }
    let stdout = ""; try { ({ stdout } = await run(cmd[0], cmd[1], { cwd, timeout: 180000, maxBuffer: 64e6 })); } catch (e) { if (e.stdout?.trim().startsWith("{")) stdout = e.stdout; else return { failure: `${cmd[0]} audit failed in ${cwd}: ${(e.stderr || e.message || "").split("\n")[0].slice(0, 160)}` }; }
    let parsed = null; const t = stdout.trim(); try { parsed = JSON.parse(t); } catch { parsed = {}; for (const l of t.split("\n")) { try { const j = JSON.parse(l); if (j.vulnerabilities || j.advisories) parsed = j; else if (j.type === "auditAdvisory") (parsed.advisories ??= {})[j.data.advisory.id] = j.data.advisory; } catch {} } }
    if (!(parsed && (parsed.vulnerabilities || parsed.advisories || parsed.metadata))) return { failure: `${cmd[0]} audit returned no recognisable JSON (${t.slice(0, 60).replace(/\n/g, " ")})` };
    const found = {}; const add = (n, sev, title, url) => (found[n] ??= []).push({ sev, title, url });
    for (const [n, v] of Object.entries(parsed.vulnerabilities || {})) { const vias = (v.via || []).filter(x => typeof x === "object"); if (vias.length) for (const x of vias) add(n, x.severity || v.severity, x.title, x.url); else add(n, v.severity, "via dependency", null); }
    for (const a of Object.values(parsed.advisories || {})) add(a.module_name, a.severity, a.title, a.url);
    return { found, note: `${scope} (${cmd[0]}, lockfile ${lock?.name || "none"})` }; },
};

adapters.php = {
  label: "composer", match: (f) => /\.php$/.test(f),
  collect(fileList) {
    const comp = findUp(["composer.json"]); const declared = {};
    if (comp) { const j = readJson(path.join(comp.dir, "composer.json")) || {}; for (const k of ["require", "require-dev"]) for (const [n, v] of Object.entries(j[k] || {})) if (n.includes("/")) declared[n] ??= { range: v, kind: k === "require" ? "dependencies" : "devDependencies" }; }
    const inst = comp ? readJson(path.join(comp.dir, "vendor", "composer", "installed.json")) : null; const pkgs = inst ? (inst.packages || inst) : [];
    const nsMap = []; for (const p of pkgs) for (const ns of Object.keys({ ...(p.autoload?.["psr-4"] || {}), ...(p.autoload?.["psr-0"] || {}) })) nsMap.push({ ns: ns.replace(/\\$/, ""), name: p.name, version: (p.version || "").replace(/^v/, "") });
    nsMap.sort((a, b) => b.ns.length - a.ns.length);
    const appNs = comp ? Object.keys((readJson(path.join(comp.dir, "composer.json")) || {}).autoload?.["psr-4"] || {}).map(n => n.replace(/\\$/, "")) : [];
    const usage = new Map(), meta = new Map();
    for (const f of fileList) { const src = stripComments(fs.readFileSync(f, "utf8")); const re = /^\s*use\s+(?:function\s+|const\s+)?\\?([A-Za-z_][\w\\]*)/gm; let m;
      while ((m = re.exec(src))) { const full = m[1]; if (appNs.some(a => full === a || full.startsWith(a + "\\"))) continue; const hit = nsMap.find(e => full === e.ns || full.startsWith(e.ns + "\\"));
        const name = hit ? hit.name : (full.split("\\").length > 1 ? `unresolved:${full.split("\\").slice(0, 2).join("\\")}` : null); if (!name) continue;
        (usage.get(name) || usage.set(name, new Set()).get(name)).add(path.relative(repo, f)); if (hit) meta.set(name, hit.version); } }
    const rows = [...usage.keys()].sort().map(n => { const un = n.startsWith("unresolved:"); return { name: un ? n.slice(11) : n, files: [...usage.get(n)], declared: declared[n]?.range || null, kind: declared[n]?.kind || (un ? "unresolved" : "transitive"), installed: meta.get(n) || null, locked: null, resolved: !un }; });
    return { rows, comp };
  },
  async registry(r) { const j = await cached(`packagist:${r.name}`, () => fetchJson(`https://repo.packagist.org/p2/${r.name}.json`)); const vers = (j.packages?.[r.name] || []).filter(v => !/dev|alpha|beta|rc/i.test(v.version));
    const latest = vers[0]; r.latest = latest ? latest.version.replace(/^v/, "") : null; r.latestDate = latest?.time?.slice(0, 10); const mine = vers.find(v => v.version.replace(/^v/, "") === r.installed); r.installedDate = mine?.time?.slice(0, 10) || null; r.license = (latest?.license || []).join("/") || null; r.deprecated = latest?.abandoned ? `abandoned${typeof latest.abandoned === "string" ? ` → ${latest.abandoned}` : ""}` : null; },
  async audit(ctx) { const cwd = ctx.comp?.dir || repo; let stdout = ""; try { ({ stdout } = await run("composer", ["audit", "--format=json", "--no-interaction"], { cwd, timeout: 180000, maxBuffer: 64e6 })); } catch (e) { if (e.stdout?.trim().startsWith("{")) stdout = e.stdout; else return { failure: `composer audit failed in ${cwd}: ${(e.stderr || e.message || "").split("\n")[0].slice(0, 160)}` }; }
    let parsed; try { parsed = JSON.parse(stdout); } catch { return { failure: `composer audit returned no JSON (${stdout.slice(0, 60)})` }; }
    const found = {}; for (const [n, list] of Object.entries(parsed.advisories || {})) for (const a of (Array.isArray(list) ? list : Object.values(list))) (found[n] ??= []).push({ sev: a.severity || "unknown", title: a.title, url: a.link });
    for (const [n, v] of Object.entries(parsed.abandoned || {})) (found[n] ??= []).push({ sev: "info", title: `abandoned${typeof v === "string" ? ` → ${v}` : ""}`, url: null });
    return { found, note: `composer audit (composer.lock in ${path.relative(repo, cwd) || "."})` }; },
};

adapters.py = {
  label: "pip", match: (f) => /\.py$/.test(f),
  collect(fileList) {
    const py = (() => { for (const d of ancestors) for (const c of [".venv/bin/python", "venv/bin/python", ".venv/Scripts/python.exe"]) if (fs.existsSync(path.join(d, c))) return path.join(d, c); return "python3"; })();
    let dists = {}, versions = {}; try { const out = execFileSync(py, ["-c", "import json,importlib.metadata as m\nd=getattr(m,'packages_distributions',None)\nres={'map':d() if d else {},'ver':{}}\nfor x in m.distributions():\n  n=x.metadata['Name']\n  res['ver'][n.lower()]=x.version\nprint(json.dumps(res))"], { encoding: "utf8", timeout: 30000 }); const j = JSON.parse(out); dists = j.map; versions = j.ver; } catch {}
    const declared = {}; const req = findUp(["requirements.txt", "pyproject.toml", "Pipfile", "requirements/base.txt"]);
    if (req) { const txt = fs.readFileSync(path.join(req.dir, req.name), "utf8");
      if (req.name.endsWith(".txt")) for (const l of txt.split("\n")) { const m = l.match(/^\s*([A-Za-z0-9_.-]+)\s*(\[.*?\])?\s*([=<>!~].*)?$/); if (m && !l.trim().startsWith("#") && !l.trim().startsWith("-")) declared[m[1].toLowerCase()] = { range: (m[3] || "*").trim(), kind: "dependencies" }; }
      else for (const m of txt.matchAll(/^\s*"?([A-Za-z0-9_.-]+)"?\s*(?:=\s*"([^"]+)"|([<>=!~][^",\n]+)?)/gm)) if (/^[a-z]/i.test(m[1]) && !["name", "version", "python", "description", "authors", "readme", "license", "requires-python"].includes(m[1])) declared[m[1].toLowerCase()] ??= { range: (m[2] || m[3] || "*").trim().replace(/^"|"$/g, ""), kind: "dependencies" }; }
    const stdlib = new Set(["os", "sys", "re", "json", "time", "datetime", "typing", "pathlib", "logging", "math", "random", "collections", "itertools", "functools", "asyncio", "uuid", "enum", "dataclasses", "abc", "io", "csv", "hashlib", "base64", "subprocess", "threading", "unittest", "decimal", "copy", "string", "shutil", "tempfile", "urllib", "http", "email", "html", "xml", "sqlite3", "socket", "struct", "textwrap", "traceback", "warnings", "contextlib", "inspect", "importlib", "secrets", "statistics", "argparse", "signal", "queue", "heapq", "bisect", "glob", "fnmatch", "zoneinfo", "types", "weakref", "operator", "pprint", "zipfile", "gzip", "pickle", "concurrent", "multiprocessing", "ssl", "ipaddress", "mimetypes", "platform", "locale", "gettext", "numbers", "fractions", "array", "select", "selectors", "codecs", "unicodedata", "difflib", "shlex", "getpass", "calendar", "dis", "ast", "tokenize", "builtins", "__future__"]);
    const localTop = new Set(fs.readdirSync(repo).map(n => n.replace(/\.py$/, "")));
    const usage = new Map();
    for (const f of fileList) { const src = stripComments(fs.readFileSync(f, "utf8")); const re = /^\s*(?:from\s+([A-Za-z_][\w.]*)\s+import|import\s+([A-Za-z_][\w.]*(?:\s*,\s*[A-Za-z_][\w.]*)*))/gm; let m;
      while ((m = re.exec(src))) for (const spec of (m[1] || m[2]).split(",")) { const top = spec.trim().split(".")[0]; if (!top || stdlib.has(top) || localTop.has(top)) continue; const ALIAS = { yaml: "pyyaml", PIL: "pillow", cv2: "opencv-python", sklearn: "scikit-learn", bs4: "beautifulsoup4", dotenv: "python-dotenv", jwt: "pyjwt", dateutil: "python-dateutil", psycopg2: "psycopg2-binary", MySQLdb: "mysqlclient", google: "google-api-python-client", attr: "attrs", Crypto: "pycryptodome", OpenSSL: "pyopenssl", wx: "wxpython", gi: "pygobject", zmq: "pyzmq", serial: "pyserial", usb: "pyusb", magic: "python-magic", ldap: "python-ldap", docx: "python-docx", pptx: "python-pptx", fitz: "pymupdf", nacl: "pynacl", Levenshtein: "python-levenshtein", markdown: "markdown", rest_framework: "djangorestframework", corsheaders: "django-cors-headers", environ: "django-environ", celery: "celery", redis: "redis", boto3: "boto3", jose: "python-jose", multipart: "python-multipart", starlette: "starlette", pydantic_settings: "pydantic-settings" };
        const dist = (dists[top] || [ALIAS[top] || top])[0]; const key = dist.toLowerCase().replace(/_/g, "-"); (usage.get(key) || usage.set(key, new Set()).get(key)).add(path.relative(repo, f)); } }
    const rows = [...usage.keys()].sort().map(n => { const inst = versions[n] || versions[n.replace(/-/g, "_")] || null; const dec = declared[n] || declared[n.replace(/-/g, "_")]; return { name: n, files: [...usage.get(n)], declared: dec?.range || null, kind: dec?.kind || (inst ? "transitive" : "unresolved"), installed: inst, locked: null, resolved: !!(dec || inst) }; });
    return { rows, py };
  },
  async registry(r) { const j = await cached(`pypi:${r.name}`, () => fetchJson(`https://pypi.org/pypi/${r.name}/json`)); r.latest = j.info?.version; const rel = (v) => j.releases?.[v]?.[0]?.upload_time?.slice(0, 10) || null; r.latestDate = rel(r.latest); r.installedDate = r.installed ? rel(r.installed) : null;
    r.license = (j.info?.license && j.info.license.length < 40 ? j.info.license : (j.info?.classifiers || []).find(c => c.startsWith("License ::"))?.split("::").pop()?.trim()) || null; r.deprecated = j.info?.yanked ? "yanked" : null; },
  async audit(ctx) { let stdout = ""; try { ({ stdout } = await run("pip-audit", ["--format=json", "--progress-spinner=off"], { cwd: repo, timeout: 300000, maxBuffer: 64e6 })); } catch (e) { if (e.stdout?.trim().startsWith("{") || e.stdout?.trim().startsWith("[")) stdout = e.stdout; else return { failure: `pip-audit not available or failed (${(e.stderr || e.message || "").split("\n")[0].slice(0, 120)}) — install: pipx install pip-audit` }; }
    let parsed; try { parsed = JSON.parse(stdout); } catch { return { failure: "pip-audit returned no JSON" }; }
    const found = {}; for (const d of (parsed.dependencies || parsed)) for (const v of (d.vulns || [])) (found[d.name.toLowerCase()] ??= []).push({ sev: v.severity || "unknown", title: v.id, url: v.id?.startsWith("GHSA") ? `https://github.com/advisories/${v.id}` : null });
    return { found, note: `pip-audit (${ctx.py})` }; },
};

// ---------- run per language present in the file list
const SEV = { critical: 4, high: 3, moderate: 2, medium: 2, low: 1, info: 0, unknown: 1 };
const major = (v) => v ? +String(v).replace(/^[^\d]*/, "").split(".")[0] : null;
const ageDays = (d) => d ? Math.round((Date.now() - new Date(d)) / 864e5) : null;
const sections = [];
for (const [lang, ad] of Object.entries(adapters)) {
  const mine = files.filter(ad.match); if (!mine.length) continue;
  const ctx = ad.collect(mine); const rows = ctx.rows;
  if (!has("no-registry")) { const q = rows.filter(r => r.resolved); await Promise.all(Array.from({ length: 6 }, async () => { while (q.length) { const r = q.shift(); try { await ad.registry(r); } catch (e) { r.registryError = (e.message || "").split("\n")[0].slice(0, 80); } } })); }
  let auditNote, found = {};
  if (has("no-audit")) auditNote = "skipped (--no-audit). Vulnerability column is unknown.";
  else { const a = await ad.audit(ctx); if (a.failure) auditNote = `FAILED — ${a.failure}. Vulnerability column is unknown, not clean.`; else { found = a.found; auditNote = `${a.note}; ${Object.keys(found).length} packages with advisories in that tree, matched to the module's imports below.`; } }
  for (const r of rows) {
    const items = found[r.name] || found[r.name.toLowerCase()]; if (items) { items.sort((x, y) => (SEV[y.sev] ?? 1) - (SEV[x.sev] ?? 1)); const top = items[0]; r.advisory = `${top.sev}: ${top.title || "see advisory"}${top.url ? ` (${top.url})` : ""}${items.length > 1 ? ` +${items.length - 1} more` : ""}`; r.topSeverity = top.sev; } else r.advisory = "";
    const v = r.installed || r.locked; const im = major(v), lm = major(r.latest);
    r.status = !r.resolved ? "unresolved — alias, local or workspace package?" : items && r.topSeverity !== "info" ? `VULNERABLE (${r.topSeverity})` : r.deprecated ? `DEPRECATED (${r.deprecated})` : !v ? "not installed / not locked" : !r.latest ? (r.registryError ? "registry error" : "unknown") : im < lm ? `${lm - im} major behind` : v !== r.latest ? "minor/patch behind" : "current";
    const d = ageDays(r.installedDate); r.age = d == null ? "" : d > 730 ? `${(d / 365).toFixed(1)} y` : d > 60 ? `${Math.round(d / 30)} mo` : `${d} d`;
  }
  sections.push({ lang, label: ad.label, files: mine.length, rows, auditNote });
}
saveCache();
if (has("json")) { console.log(JSON.stringify({ repo, sections }, null, 2)); process.exit(0); }
const esc = (s) => String(s ?? "").replace(/\|/g, "\\|");
for (const sec of sections) {
  if (sections.length > 1) console.log(`### ${sec.label} (${sec.files} files)\n`);
  console.log(`| Package | Used by | Declared | Installed | Latest | Installed age | License | Status | Advisory |\n|---|---|---|---|---|---|---|---|---|`);
  for (const r of sec.rows) console.log(`| \`${r.name}\` | ${r.files.length} file${r.files.length > 1 ? "s" : ""} | ${esc(r.declared || "—")}${r.kind === "dependencies" || r.kind === "unresolved" ? "" : ` (${r.kind.replace("Dependencies", "")})`} | ${r.installed || (r.locked ? `${r.locked} (locked)` : "—")} | ${r.latest || "—"} | ${r.age || "—"} | ${esc(r.license) || "—"} | ${r.status} | ${esc(r.advisory) || "—"} |`);
  console.log(`\nAudit (${sec.label}): ${sec.auditNote}\n`);
}
console.log(`Files scanned: ${files.length}. Registry: ${has("no-registry") ? "skipped" : `live + 24h cache, ${new Date().toISOString().slice(0, 10)}`}. Maintenance status is not inferred from age alone — check repository activity for anything older than two years.`);
