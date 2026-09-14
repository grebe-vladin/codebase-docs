#!/usr/bin/env node
// Put numbered markers on a screenshot so steps in the text match the picture.
// Usage: annotate.mjs <in.png> <out.png> --mark x,y[,label] [--mark ...] [--box x,y,w,h[,label]] [--brand-dir <dir>] [--scale 1]
// Coordinates are in the source image's pixels (as reported by the screenshot tool at scale 1).
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2); const [inp, out] = args;
if (!inp || !out || !fs.existsSync(inp)) { console.error("usage: annotate.mjs <in.png> <out.png> --mark x,y[,label] ... [--box x,y,w,h[,label]] [--brand-dir dir]"); process.exit(1); }
const all = (k) => args.map((a, i) => a === `--${k}` ? args[i + 1] : null).filter(Boolean);
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i === -1 ? d : args[i + 1]; };
const buf = fs.readFileSync(inp); const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
const scale = +opt("scale", 1); const brandDir = opt("brand-dir"); const css = brandDir && fs.existsSync(path.join(brandDir, "brand.css")) ? fs.readFileSync(path.join(brandDir, "brand.css"), "utf8") : ":root{--accent:#e07a1f;--paper:#fff;--ink:#1a1a1a}";
const marks = all("mark").map((m, i) => { const [x, y, ...l] = m.split(","); return { x: +x, y: +y, n: i + 1, label: l.join(",") }; });
const boxes = all("box").map(b => { const [x, y, bw, bh, ...l] = b.split(","); return { x: +x, y: +y, w: +bw, h: +bh, label: l.join(",") }; });
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}
html,body{margin:0;background:#fff}.wrap{position:relative;width:${w}px;height:${h}px;transform:scale(${scale});transform-origin:0 0}.wrap img{display:block;width:${w}px;height:${h}px}
.m{position:absolute;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;background:var(--accent);color:#fff;font:700 15px/30px Inter,system-ui,sans-serif;text-align:center;box-shadow:0 0 0 3px #fff,0 2px 6px rgba(0,0,0,.35)}
.l{position:absolute;margin:-14px 0 0 20px;background:var(--paper);color:var(--ink);border:1.5px solid var(--accent);border-radius:6px;padding:3px 8px;font:600 13px Inter,system-ui,sans-serif;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.2)}
.b{position:absolute;border:3px solid var(--accent);border-radius:6px;box-shadow:0 0 0 2px #fff}.bl{position:absolute;background:var(--accent);color:#fff;font:600 12px Inter,system-ui,sans-serif;padding:2px 7px;border-radius:4px 4px 0 0;transform:translateY(-100%)}
</style></head><body data-width="${Math.round(w * scale)}" data-height="${Math.round(h * scale)}"><div class="wrap"><img src="data:image/png;base64,${buf.toString("base64")}">
${boxes.map(b => `<div class="b" style="left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px"></div>${b.label ? `<div class="bl" style="left:${b.x}px;top:${b.y}px">${b.label}</div>` : ""}`).join("")}
${marks.map(m => `<div class="m" style="left:${m.x}px;top:${m.y}px">${m.n}</div>${m.label ? `<div class="l" style="left:${m.x}px;top:${m.y}px">${m.label}</div>` : ""}`).join("")}
</div></body></html>`;
const tmp = out.replace(/\.png$/i, "") + ".annotate.html"; fs.writeFileSync(tmp, html);
execFileSync("bash", [path.join(here, "render-diagram.sh"), tmp, out], { stdio: "ignore" }); fs.unlinkSync(tmp);
console.log(`${out}  (${marks.length} markers, ${boxes.length} boxes on ${w}x${h})`);
