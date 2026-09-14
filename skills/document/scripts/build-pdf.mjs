#!/usr/bin/env node
// Build <module>.html and <module>.pdf from <module>.md using templates/doc.html + brand.css.
// Usage: build-pdf.mjs <path/to/module.md> [--brand-dir <dir>] [--no-pdf] [--history] [--docx] [--compact]
//   --history  also copies the PDF to <dir>/history/<date>-<sha7>.pdf     --docx  also writes .docx via pandoc (if installed)
//   --compact  one-pager mode: header band instead of cover, no contents page (for <module>.onepager.md)
// Expects the stamp comment at the top of the md:  <!-- codebase-docs {"module":..,"title":..,"company":..,"generated":..,"repos":{..}} -->
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const md = args[0]; if (!md) { console.error("usage: build-pdf.mjs <module.md> [--brand-dir dir] [--no-pdf]"); process.exit(1); }
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i === -1 ? d : args[i + 1]; };
const mdAbs = path.resolve(md), dir = path.dirname(mdAbs), base = path.basename(mdAbs, ".md");
const brandDir = path.resolve(opt("brand-dir", path.join(dir, "assets", "brand")));
const compact = args.includes("--compact");
const src = fs.readFileSync(mdAbs, "utf8");

const stampM = src.match(/<!--\s*codebase-docs\s+(\{[\s\S]*?\})\s*-->/);
const stamp = stampM ? JSON.parse(stampM[1]) : {};
const body = src.replace(/<!--\s*codebase-docs[\s\S]*?-->/, "");

// markdown -> html via marked CLI (npx, cached after first run)
let html = execFileSync("npx", ["-y", "marked@18", "--gfm"], { input: body, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

// heading ids + TOC (h2/h3)
const slug = (s) => s.toLowerCase().replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const toc = []; const seen = {};
html = html.replace(/<h([1-3])>([\s\S]*?)<\/h\1>/g, (m, l, t) => {
  let id = slug(t) || "s"; if (seen[id]) id += "-" + (++seen[id]); else seen[id] = 1;
  if (l !== "1") toc.push({ l: +l, id, t: t.replace(/<[^>]+>/g, "") });
  return `<h${l} id="${id}">${t}</h${l}>`;
});
let tocHtml = ""; let open = 0;
for (const e of toc) { if (e.l === 2) tocHtml += `${open ? "</ul></li>" : ""}<li><a href="#${e.id}">${e.t}</a><ul>`, open = 1; else if (open) tocHtml += `<li><a href="#${e.id}">${e.t}</a></li>`; }
tocHtml += open ? "</ul></li>" : "";
// figures: <p><img></p> -> figure with caption
html = html.replace(/<p><img src="([^"]+)" alt="([^"]*)"\s*\/?><\/p>/g, (m, s, a) => `<figure><img src="${s}" alt="${a}">${a ? `<figcaption>${a}</figcaption>` : ""}</figure>`);
// tables scroll-safe wrapper
html = html.replace(/<table>/g, '<div class="tbl"><table>').replace(/<\/table>/g, "</table></div>");

const brandJson = fs.existsSync(path.join(brandDir, "brand.json")) ? JSON.parse(fs.readFileSync(path.join(brandDir, "brand.json"), "utf8")) : { name: "" };
const rel = (p) => path.relative(dir, p).split(path.sep).join("/");
const logo = brandJson.logo ? `<img class="logo" src="${rel(path.join(brandDir, brandJson.logo))}" alt="${brandJson.name}">` : `<div class="logo-text">${brandJson.name || ""}</div>`;
const repos = Object.entries(stamp.repos || {}).map(([r, v]) => `<tr><th>${r}</th><td><code>${(v.sha || v).slice(0, 10)}</code>${v.branch ? ` <span class="muted">${v.branch}</span>` : ""}</td></tr>`).join("");
// fixed labels by language; the stamp's "labels" object overrides any of them
const LABELS = {
  en: { module: "Module", company: "Company", audience: "Audience", generated: "Generated", contents: "Contents", kicker: "Technical documentation", version: "Version", contract: "Contract", project: "Project", beneficiary: "Beneficiary" },
  ro: { module: "Modul", company: "Companie", audience: "Audiență", generated: "Generat", contents: "Cuprins", kicker: "Documentație tehnică", version: "Versiune", contract: "Contract", project: "Proiect", beneficiary: "Beneficiar" },
  de: { module: "Modul", company: "Unternehmen", audience: "Zielgruppe", generated: "Erstellt", contents: "Inhalt", kicker: "Technische Dokumentation", version: "Version" },
  fr: { module: "Module", company: "Entreprise", audience: "Public", generated: "Généré", contents: "Sommaire", kicker: "Documentation technique", version: "Version" },
  es: { module: "Módulo", company: "Empresa", audience: "Audiencia", generated: "Generado", contents: "Contenido", kicker: "Documentación técnica", version: "Versión" },
  it: { module: "Modulo", company: "Azienda", audience: "Destinatari", generated: "Generato", contents: "Indice", kicker: "Documentazione tecnica", version: "Versione" },
};
const lang = (stamp.language || "en").slice(0, 2).toLowerCase();
const L = { ...LABELS.en, ...(LABELS[lang] || {}), ...(stamp.labels || {}) };
if (stamp.kicker) L.kicker = stamp.kicker; if (stamp.tocLabel) L.contents = stamp.tocLabel;
const meta = `<table class="meta">
<tr><th>${L.module}</th><td>${stamp.module || base}</td></tr>
${stamp.company ? `<tr><th>${L.company}</th><td>${stamp.company}</td></tr>` : ""}
${stamp.audience ? `<tr><th>${L.audience}</th><td>${stamp.audience}</td></tr>` : ""}
<tr><th>${L.generated}</th><td>${stamp.generated || new Date().toISOString().slice(0, 10)}</td></tr>
${repos}
</table>`;
// funding block: stamp.funding = { placement: "header"|"footer"|"both"|"cover", banners: ["funding/eu.png", …] (relative to assets/brand), text, identifiers: {smisCode, contractNumber, projectTitle, beneficiary} }
const fund = stamp.funding || null;
const bannerImgs = (list) => (list || []).map(b => typeof b === "string" ? { file: b, alt: path.basename(b, path.extname(b)) } : b).map(b => `<img src="${rel(path.join(brandDir, b.file))}" alt="${b.alt || ""}">`).join("");
const coverImgs = bannerImgs(fund ? fund.banners : brandJson.banners);
const idLine = fund?.identifiers ? Object.entries(fund.identifiers).filter(([, v]) => v).map(([k, v]) => `${({ smisCode: "SMIS", contractNumber: L.contract || "Contract", projectTitle: L.project || "Project", beneficiary: L.beneficiary || "Beneficiary" })[k] || k}: ${v}`).join(" · ") : "";
const fundText = fund ? [fund.text, idLine].filter(Boolean).join(" — ") : brandJson.fundingText || "";
const bannersHtml = coverImgs ? `<div class="cover-banners">${coverImgs}${fundText ? `<p>${fundText}</p>` : ""}</div>` : "";
const placement = fund?.placement || "cover";
const bar = (cls) => `<div class="funding-bar ${cls}">${coverImgs}<span>${fund.text || ""}</span></div>`;
const fundingBars = fund && placement !== "cover" ? `${placement !== "footer" ? bar("top") : ""}${placement !== "header" ? bar("bottom") : ""}` : "";
const bodyClass = [fund && placement !== "cover" ? `has-funding-${placement}` : "", compact ? "compact" : ""].filter(Boolean).join(" ");

let tpl = fs.readFileSync(path.join(here, "..", "templates", "doc.html"), "utf8");
const css = fs.readFileSync(path.join(here, "..", "templates", "doc.css"), "utf8");
const brandCss = fs.existsSync(path.join(brandDir, "brand.css")) ? fs.readFileSync(path.join(brandDir, "brand.css"), "utf8") : "";
const title = stamp.title || (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [, base])[1].replace(/<[^>]+>/g, "");
const footerText = stamp.footerText || brandJson.footerText || brandJson.name || "";
const vars = { title, subtitle: stamp.subtitle || "", brand_css: brandCss, doc_css: css, logo, meta, toc: tocHtml, body: html, banners: bannersHtml, lang, funding_bars: fundingBars, body_class: bodyClass,
  brand_name: brandJson.name || "", footer_text: footerText.replace(/"/g, "'"), generated: stamp.generated || new Date().toISOString().slice(0, 10), toc_label: L.contents, kicker: L.kicker };
const out = tpl.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars ? vars[k] : m));
const htmlPath = path.join(dir, base + ".html"); fs.writeFileSync(htmlPath, out);
console.log(`html: ${htmlPath}`);

if (!args.includes("--no-pdf")) {
  const chrome = execFileSync(path.join(here, "find-chrome.sh"), { encoding: "utf8" }).trim();
  const pdfPath = path.join(dir, base + ".pdf");
  execFileSync(chrome, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--no-pdf-header-footer", "--force-color-profile=srgb",
    "--virtual-time-budget=6000", `--print-to-pdf=${pdfPath}`, `file://${htmlPath}`], { stdio: "ignore" });
  console.log(`pdf:  ${pdfPath}`);
  if (args.includes("--history")) {
    const shas = Object.values(stamp.repos || {}).map(v => (v.sha || v).slice(0, 7)).join("-") || "nosha";
    const hdir = path.join(dir, "history"); fs.mkdirSync(hdir, { recursive: true });
    const hp = path.join(hdir, `${stamp.generated || new Date().toISOString().slice(0, 10)}-${shas}${compact ? ".onepager" : ""}.pdf`); fs.copyFileSync(pdfPath, hp); console.log(`history: ${hp}`);
  }
}
if (args.includes("--docx")) {
  try { execFileSync("pandoc", ["--version"], { stdio: "ignore" }); } catch { console.log("docx: skipped — pandoc not installed (brew install pandoc | apt-get install pandoc)"); process.exit(0); }
  const tmpMd = path.join(dir, `.${base}.docx.md`);
  fs.writeFileSync(tmpMd, `---\ntitle: "${title.replace(/"/g, "'")}"\nsubtitle: "${(stamp.subtitle || "").replace(/"/g, "'")}"\ndate: "${stamp.generated || ""}"\nlang: "${lang}"\n---\n\n` + body.replace(/^# .*\n/m, "").replace(/<div class="page-break"><\/div>/g, "").replace(/<div class="callout( warn)?">([\s\S]*?)<\/div>/g, "> $2"));
  const docxPath = path.join(dir, base + ".docx");
  try { execFileSync("pandoc", [tmpMd, "-o", docxPath, "--resource-path", dir, "--toc", "--toc-depth=2"], { cwd: dir, stdio: "pipe" }); console.log(`docx: ${docxPath}`); }
  catch (e) { console.log(`docx: failed — ${(e.stderr || e.message).toString().split("\n")[0]}`); }
  finally { fs.unlinkSync(tmpMd); }
}
