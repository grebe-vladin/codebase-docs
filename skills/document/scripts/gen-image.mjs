#!/usr/bin/env node
// Generate or restyle a diagram with Gemini image models ("Nano Banana").
// Key: GEMINI_API_KEY env var only — never stored in this plugin.
// Usage:
//   gen-image.mjs --prompt-file p.txt --out diagram.png [--model pro|normal|lite] [--aspect 16:9] [--size 1K|2K|4K] [--ref a.png --ref b.png] [--max-retries 2]
// With --ref, the prompt should say to keep the reference layout/text and only restyle (see NANO-BANANA.md).
import fs from "node:fs";
import path from "node:path";

const MODELS = { pro: "gemini-3-pro-image", normal: "gemini-3.1-flash-image", lite: "gemini-3.1-flash-lite-image" };
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i === -1 ? d : args[i + 1]; };
const all = (k) => args.map((a, i) => a === `--${k}` ? args[i + 1] : null).filter(Boolean);
const key = process.env.GEMINI_API_KEY;
if (!key) { console.error("GEMINI_API_KEY is not set. Export it in your shell (never write it into the plugin)."); process.exit(2); }
const promptFile = opt("prompt-file"), out = opt("out");
if (!promptFile || !out) { console.error("usage: gen-image.mjs --prompt-file p.txt --out x.png [--model pro|normal|lite] [--aspect 16:9] [--size 2K] [--ref img.png ...]"); process.exit(1); }
const modelKey = opt("model", "pro"); const model = MODELS[modelKey] || modelKey;
const mime = (f) => ({ ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" })[path.extname(f).toLowerCase()] || "image/png";
const parts = [];
for (const r of all("ref")) parts.push({ inlineData: { mimeType: mime(r), data: fs.readFileSync(r).toString("base64") } });
parts.push({ text: fs.readFileSync(promptFile, "utf8") });
const imageConfig = { aspectRatio: opt("aspect", "16:9") };
if (opt("size")) imageConfig.imageSize = opt("size"); else if (modelKey === "pro") imageConfig.imageSize = "2K";
const body = { contents: [{ parts }], generationConfig: { responseModalities: ["IMAGE"], imageConfig } };
const retries = +opt("max-retries", 2);
for (let attempt = 0; attempt <= retries; attempt++) {
  const t = Date.now();
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST", headers: { "x-goog-api-key": key, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json();
  if (!res.ok) { console.error(`HTTP ${res.status}: ${JSON.stringify(json).slice(0, 500)}`); if (res.status === 429 || res.status >= 500) { await new Promise(r => setTimeout(r, 3000 * (attempt + 1))); continue; } process.exit(1); }
  const cand = json.candidates?.[0]; const img = cand?.content?.parts?.find(p => p.inlineData);
  if (!img) { console.error(`no image returned (finishReason=${cand?.finishReason}); ${JSON.stringify(json).slice(0, 400)}`); continue; }
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  fs.writeFileSync(out, Buffer.from(img.inlineData.data, "base64"));
  const u = json.usageMetadata || {};
  console.log(`${out}  model=${model} ${imageConfig.aspectRatio} ${imageConfig.imageSize || ""} ${((Date.now() - t) / 1000).toFixed(0)}s  tokens in=${u.promptTokenCount} out=${u.candidatesTokenCount}`);
  process.exit(0);
}
console.error("failed after retries"); process.exit(1);
