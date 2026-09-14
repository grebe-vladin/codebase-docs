# Nano Banana (Gemini image models) — polish pass

Used only when the wizard chose engine **pro**. The model never designs a diagram from text: in two of three trials it rewired arrows. It restyles a finished HTML render, which keeps layout, text and arrows fixed.

## Script

```
GEMINI_API_KEY=… node scripts/gen-image.mjs --model pro --prompt-file <p.txt> --ref <html-render.png> --out <name>.png [--aspect 16:9] [--size 2K]
```

- Key: `GEMINI_API_KEY` from the environment only. It is never written to the plugin, the docs folder or the brand store. Missing key → tell the user, fall back to HTML.
- Models: `pro` = `gemini-3-pro-image` (best text, ~$0.134 per 1K/2K image), `normal` = `gemini-3.1-flash-image` (~$0.10 at 2K), `lite` = `gemini-3.1-flash-lite-image` (1K only, weakest text). Prices from ai.google.dev pricing, 2026-09; say the cost to the user before a batch.
- `--aspect` must match the reference (16:9 for 1400×800, 1400×700 → 2:1 is not offered, use 16:9 and accept small margins). `--size 2K` for pro; every output carries a SynthID watermark.
- Rate limits are per project; on 429 the script retries twice.

## Prompt recipe (put in the prompt file)

Narrative, not keywords. Four parts, in this order:

1. **What the reference is**: "The attached image is a software architecture diagram rendered from HTML."
2. **What must stay identical**: "Recreate it keeping exactly the same boxes, the same text spelled character for character, the same arrows with the same start box, end box and label, and the same layout. Do not add, remove or rename anything."
3. **What may improve**: spacing, arrows that never cross a box or a label, consistent stroke weights, subtle depth, crisp Inter-like typography.
4. **Style anchors**: white background, the brand hex colours by role (primary for X, accent for Y), legend position, the logo mark and brand text and where they sit.

Google's own guidance the recipe follows: describe the scene as prose; state the purpose ("for technical documentation"); quote exact text and name the font; give layout step by step; phrase constraints positively ("keep the background white", not "no background"); for edits say "change only … keep everything else exactly the same". Best results in English; write labels in the document language inside the reference, the model copies them.

## Fidelity check (after every generation)

Read the PNG and compare with the HTML render:

- Every label present and spelled identically (brand names and short words are the ones it garbles).
- Every arrow has the same endpoints and label; nothing added.
- Legend and brand mark intact; no artefacts at the edges; no watermark-like smudges over text.

One fail → regenerate once with the failing item named in the prompt ("the text 'Acme Test' must read exactly 'Acme Test'"). Second fail → keep the HTML render and say so in the report.
