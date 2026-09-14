#!/usr/bin/env node
// Fetch a funding programme's official logos/banners into templates/funding/<program>/ from the sources listed in programs.json.
// Usage: funding-assets.mjs fetch <program> [--force]      downloads every source (zip → extracted, pdf → kept for reading)
//        funding-assets.mjs list [program]                  what is on disk per programme
//        funding-assets.mjs confirm <program> <file> ...    marks files as the programme's banner set (order = display order)
// The agent LOOKS at every downloaded image and the user CONFIRMS before a file becomes a banner — official sets change, and
// programme manuals impose exact lockups; nothing here is used unconfirmed.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const FUND = path.join(here, "..", "templates", "funding");
const REG = path.join(FUND, "programs.json");

// ---- trim white/transparent margins of a PNG (8-bit RGB/RGBA, non-interlaced), keeping 3% padding
import zlib from "node:zlib";
function trimPng(file) {
  const b = fs.readFileSync(file); if (b.readUInt32BE(0) !== 0x89504e47) return;
  let p = 8, w, h, ct, idat = []; const chunks = [];
  while (p < b.length) { const len = b.readUInt32BE(p), t = b.toString("ascii", p + 4, p + 8), d = b.subarray(p + 8, p + 8 + len); if (t === "IHDR") { w = d.readUInt32BE(0); h = d.readUInt32BE(4); if (d[8] !== 8 || d[12] !== 0) return; ct = d[9]; } if (t === "IDAT") idat.push(d); chunks.push(t); p += 12 + len; }
  if (ct !== 2 && ct !== 6) return; const bpp = ct === 6 ? 4 : 3, stride = w * bpp + 1, raw = zlib.inflateSync(Buffer.concat(idat)), px = Buffer.alloc(w * h * bpp);
  const pa = (a, bb, c) => { const q = a + bb - c, x = Math.abs(q - a), y = Math.abs(q - bb), z = Math.abs(q - c); return x <= y && x <= z ? a : y <= z ? bb : c; };
  for (let y = 0; y < h; y++) { const f = raw[y * stride]; for (let x = 0; x < w * bpp; x++) { const v = raw[y * stride + 1 + x], a = x >= bpp ? px[y * w * bpp + x - bpp] : 0, u = y ? px[(y - 1) * w * bpp + x] : 0, c = x >= bpp && y ? px[(y - 1) * w * bpp + x - bpp] : 0; px[y * w * bpp + x] = (f === 0 ? v : f === 1 ? v + a : f === 2 ? v + u : f === 3 ? v + ((a + u) >> 1) : v + pa(a, u, c)) & 255; } }
  const blank = (i) => (ct === 6 && px[i + 3] < 8) || (px[i] > 245 && px[i + 1] > 245 && px[i + 2] > 245);
  let x0 = w, y0 = h, x1 = -1, y1 = -1; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!blank((y * w + x) * bpp)) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0 || (x0 === 0 && y0 === 0 && x1 === w - 1 && y1 === h - 1)) return;
  const padX = Math.round((x1 - x0) * 0.03), padY = Math.round((y1 - y0) * 0.03); x0 = Math.max(0, x0 - padX); y0 = Math.max(0, y0 - padY); x1 = Math.min(w - 1, x1 + padX); y1 = Math.min(h - 1, y1 + padY);
  const nw = x1 - x0 + 1, nh = y1 - y0 + 1, outRaw = Buffer.alloc(nh * (nw * bpp + 1));
  for (let y = 0; y < nh; y++) { outRaw[y * (nw * bpp + 1)] = 0; px.copy(outRaw, y * (nw * bpp + 1) + 1, ((y + y0) * w + x0) * bpp, ((y + y0) * w + x1 + 1) * bpp); }
  const crc = (buf) => { let c = ~0; for (const v of buf) { c ^= v; for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1; } return (~c) >>> 0; };
  const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t, "ascii"), d]); const cc = Buffer.alloc(4); cc.writeUInt32BE(crc(td)); return Buffer.concat([len, td, cc]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(nw, 0); ihdr.writeUInt32BE(nh, 4); ihdr[8] = 8; ihdr[9] = ct; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  fs.writeFileSync(file, Buffer.concat([b.subarray(0, 8), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(outRaw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]));
}

const args = process.argv.slice(2); const cmd = args[0], prog = args[1]; const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i === -1 ? d : args[i + 1]; };
const reg = JSON.parse(fs.readFileSync(REG, "utf8"));
const save = () => fs.writeFileSync(REG, JSON.stringify(reg, null, 2) + "\n");
const IMG = /\.(png|svg|jpe?g|webp|eps|ai|pdf)$/i;
const list = (p) => { const d = path.join(FUND, p); if (!fs.existsSync(d)) return []; const out = []; const walk = (x, depth) => { for (const e of fs.readdirSync(x, { withFileTypes: true })) { const f = path.join(x, e.name); if (e.isDirectory() && depth < 8) walk(f, depth + 1); else if (IMG.test(e.name) && !/^\./.test(e.name)) out.push(path.relative(d, f)); } }; walk(d, 0); return out.sort(); };

if (cmd === "list") {
  for (const [k, v] of Object.entries(reg)) { if (k.startsWith("_") || (prog && k !== prog)) continue; const files = list(k);
    console.log(`${k} — ${v.name}\n  confirmed banners: ${(v.banners || []).length ? v.banners.join(", ") : "none"}\n  sources: ${(v.sources || []).length}\n  files on disk: ${files.length ? files.join(", ") : "none"}`); }
} else if (cmd === "fetch") {
  const p = reg[prog]; if (!p) { console.error(`unknown programme "${prog}" — keys: ${Object.keys(reg).filter(k => !k.startsWith("_")).join(", ")}`); process.exit(1); }
  const dir = path.join(FUND, prog, "downloads"); fs.mkdirSync(dir, { recursive: true }); const force = args.includes("--force");
  if (!(p.sources || []).length) { console.log(`no sources listed for ${prog} in programs.json — add {url, note} entries or ask the user for the files`); process.exit(0); }
  for (const src of p.sources) {
    const name = src.file || decodeURIComponent(path.basename(new URL(src.url).pathname)) || "download"; const dst = path.join(dir, name);
    if (fs.existsSync(dst) && !force) { console.log(`kept     ${name}`); }
    else { if (src.insecure && !/^[0-9a-f]{64}$/i.test(src.sha256 || "")) { console.log(`SKIPPED  ${name}: source is marked insecure (TLS not verifiable) and has no pinned sha256 in programs.json — add one or fetch by hand`); continue; }
      try { execFileSync("curl", ["-L", "-sS", "--fail", "-A", "Mozilla/5.0 codebase-docs funding-assets", ...(src.insecure ? ["-k"] : []), "-o", dst, src.url], { stdio: ["ignore", "ignore", "pipe"], timeout: 600000 });
        if (src.sha256) { const got = createHash("sha256").update(fs.readFileSync(dst)).digest("hex"); if (got !== src.sha256.toLowerCase()) { fs.unlinkSync(dst); console.log(`REJECTED ${name}: sha256 ${got.slice(0, 12)}… does not match the pinned ${src.sha256.slice(0, 12)}… — the file changed or the download was tampered with; verify on ${src.page || src.url} and update programs.json`); continue; } }
        console.log(`fetched  ${name}  (${(fs.statSync(dst).size / 1024 / 1024).toFixed(1)} MB${src.sha256 ? ", sha256 verified" : ""})${src.note ? ` — ${src.note}` : ""}`); }
      catch (e) { console.log(`FAILED   ${name}: ${(e.stderr || e.message).toString().split("\n")[0].slice(0, 120)} — source may have moved; check ${src.page || src.url}`); continue; } }
    if (/\.zip$/i.test(name)) { const x = path.join(dir, name.replace(/\.zip$/i, "")); if (!fs.existsSync(x) || force) { try { execFileSync("unzip", ["-o", "-q", dst, "-d", x], { stdio: "ignore" }); console.log(`         unzipped → downloads/${path.basename(x)}/`); } catch { console.log("         (unzip failed or not available — extract by hand)"); } }
      // nested zips (the 2014-2020 pack carries the Government sigla inside)
      const nested = []; const walk = (d, depth) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory() && depth < 4) walk(f, depth + 1); else if (/\.zip$/i.test(e.name)) nested.push(f); } }; if (fs.existsSync(x)) walk(x, 0);
      for (const z of nested) { const zx = z.replace(/\.zip$/i, ""); if (!fs.existsSync(zx)) { try { execFileSync("unzip", ["-o", "-q", z, "-d", zx], { stdio: "ignore" }); } catch {} } } }
  }
  // rasterise vector-only logos (.ai is PDF-compatible, .pdf logos) to PNG at 300 dpi, next to the source, so they can be looked at and used
  let ras = 0; const vecs = []; const walkV = (d, depth) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory() && depth < 6) walkV(f, depth + 1); else if (/\.(ai|pdf)$/i.test(e.name) && /logo|sigla|emblem|UE|IS-|PNRR|NextGEN/i.test(e.name) && !/manual|miv|ghid|ordin|monitorul/i.test(e.name)) vecs.push(f); } }; walkV(dir, 0);
  for (const v of vecs) { const out = v.replace(/\.(ai|pdf)$/i, ""); if (fs.existsSync(out + ".png")) continue; try { execFileSync("pdftoppm", ["-png", "-r", "300", "-f", "1", "-l", "1", "-singlefile", v, out], { stdio: "ignore" }); trimPng(out + ".png"); ras++; } catch {} }
  if (vecs.length) console.log(`         rasterised ${ras} vector logo(s) to PNG (pdftoppm, 300 dpi)`);
  const files = list(prog); const globRe = (g) => new RegExp("^" + g.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*\//g, "\u0000").replace(/\*\*/g, "\u0001").replace(/\*/g, "[^/]*").replace(/\u0000/g, "(?:.*/)?").replace(/\u0001/g, ".*") + "$", "i");
  const picks = (p.pick || []).map(g => files.filter(f => globRe(g).test(f)));
  console.log(`\nFiles for ${prog}: ${files.length} images/vectors under templates/funding/${prog}/ (downloads/…).`);
  console.log(`\nRecommended set, in display order (${(p.order || []).join(" → ") || "as listed"}):`);
  picks.forEach((m, i) => console.log(`  ${i + 1}. ${p.pick[i]}\n     ${m.length ? m.map(f => `→ ${f}`).join("\n     ") : `→ NOT FOUND — pick by hand from the list (funding-assets.mjs list ${prog})`}`));
  console.log(`\nLook at each recommended image (Read), show them to the user, then: node scripts/funding-assets.mjs confirm ${prog} <file> <file> <file>`);
  console.log(`Rules: ${p.rules || "see programme manual"}\nManuals: ${(p.sources || []).filter(s => /manual|ghid|guide|rules|miv/i.test((s.note || "") + (s.file || ""))).map(s => `downloads/${s.file}`).join(", ") || "see programme page"}`);
} else if (cmd === "confirm") {
  const p = reg[prog]; const files = args.slice(2).filter((a, i, arr) => !a.startsWith("--") && !(i > 0 && arr[i - 1].startsWith("--"))); if (!p || !files.length) { console.error("usage: confirm <program> <file-relative-to-templates/funding/<program>> ..."); process.exit(1); }
  for (const f of files) if (!fs.existsSync(path.join(FUND, prog, f))) { console.error(`missing: ${f}`); process.exit(1); }
  const roles = p.order || []; const out = [];
  files.forEach((f, i) => { const role = roles[i] || `banner-${i + 1}`; const ext = path.extname(f).toLowerCase() || ".png"; const dst = `${role}${ext}`; fs.copyFileSync(path.join(FUND, prog, f), path.join(FUND, prog, dst)); if (ext === ".png") trimPng(path.join(FUND, prog, dst)); out.push(dst); });
  p.banners = out; p.bannerSources = files; p.confirmedAt = new Date().toISOString().slice(0, 10); p.confirmedBy = opt("by", "user"); save();
  console.log(`confirmed ${out.length} banner(s) for ${prog}: ${out.join(", ")} (copied from downloads/, committed with the plugin)`);
} else { console.error("usage: funding-assets.mjs list [program] | fetch <program> [--force] | confirm <program> <file> ..."); process.exit(1); }
