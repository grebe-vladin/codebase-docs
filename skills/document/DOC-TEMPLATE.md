# Document template

**Essence first.** After page one the reader can say what the module is, why it exists and how it works. Prefer a diagram or a table to prose. Every sentence carries a fact; delete the ones that only announce a section.

## Writing rules

- Language from the wizard, consistently — code identifiers stay as in the code, in backticks on first mention.
- Active voice, short sentences, no filler ("this section describes…", "as we can see").
- Use the code's names for things; one term per concept, defined once in the glossary if a newcomer would stumble.
- File references as `repo/path/file.ts` (and `:line` when it matters). Never paste secrets or real credentials; env vars get a purpose and an example shape.
- Every figure has a caption and is referenced from the text next to it: `![Caption](assets/diagrams/name.png)`.
- Design reasons: cite the source (`comment in …`, `ADR-12`, `PR #341`) or mark "inferred".
- No "TODO", no "TBD", no empty section — remove a section instead of leaving it thin.

## Structure

Line 1 is the stamp (see below). Then `# <Module name>` and these `##` sections, numbered:

1. **Summary** (≤150 words): what it does, for whom, why it exists, the mechanism in one sentence.
2. **How it works**: the main path as a narrative, referencing the architecture diagram; key design choices and their why, in callouts.
3. **Architecture**: architecture diagram + component table (component, repo, path, responsibility).
4. **User flows**: one `###` per flow — swimlane diagram, numbered steps (numbers match the diagram), screenshots, failure paths.
5. **Data model**: entity diagram + table (entity, key fields, relations, store).
6. **API surface**: table (method, path, auth, purpose, frontend caller). Deep: DTO fields.
7. **Integrations & background work**: external services, queues, cron, webhooks, events.
8. **Configuration**: env vars and flags (name, repo, purpose).
9. **Dependencies**: the table from `scripts/deps-report.mjs` per repo (package, used by, declared, installed, latest, age, status, advisory), then a short "watch list": every package that is a major behind, older than two years, vulnerable, unmaintained, or carrying an unusual licence, with what it is used for and what replacing it would touch.
10. **Security — what to watch for**: attack surface of this module: auth and role gating per endpoint and screen; input validation and where it is missing; injection points (raw queries, `eval`, HTML rendering, file uploads); secrets handling; rate limiting; data exposure in responses and logs; third-party calls and what data leaves the system; anything found in code marked as a risk, with file references. Findings, not lectures.
11. **Operations — what to monitor**: the signals that say the module is healthy or failing: queue depth and failed jobs, error rates per endpoint, latency of the external calls, cron last-run, log lines that mean trouble, alerts that exist or should. Each entry: signal, where it lives (log, metric, table), normal value, what to do when it is off.
12. **Known limitations & tech debt** seen in the code.
13. **Glossary**.
14. **File index** (deep only): repo, path, one line each.

On an update run, insert **"What changed since <date>"** right after the Summary: three to ten bullets, each "what changed → which section/diagram was updated", plus one line for anything removed. Source: `changes-since.mjs`.

Audience trims it: *onboarding* → all; *handover* → 1–5 full, 6–12 compact; *client* → 1–5, 7, 9 (watch list only), 10–11; *audit* → all, 9–12 emphasised.

Length: concise 6–12 PDF pages, deep up to 25.

## One-pager (`<module>.onepager.md`, built with `--compact`)

Same stamp (title suffixed " — one-pager"), then: `# <Module>`; **What it is** (≤ 60 words: what, why, mechanism); the architecture diagram; **Three things to know** (the three facts a decision maker must not miss: a design choice, a risk, a debt); **What to monitor** (three-row table); **Contacts** (owner, where the full document is). One A4 page — check the page count.

## Markdown the builder understands

GFM tables, fenced code, task lists, HTML comments, `<div class="callout">…</div>`, `<div class="callout warn">…</div>`, `<div class="page-break"></div>`. Headings `##`/`###` feed the table of contents.

## Stamp (line 1)

```
<!-- codebase-docs {"module":"orders","title":"Orders module","subtitle":"…","company":"Acme","audience":"Developers + product (handover)","language":"ro","engine":"html","generated":"2026-09-14",
  "labels":{"kicker":"Documentație tehnică"},
  "repos":{"web":{"sha":"<full sha>","branch":"main","paths":["src/app/orders/**","src/hooks/useOrders.ts","src/lib/api/orders.ts"]},"api":{"sha":"<full sha>","branch":"main","paths":["src/orders/**"]}},
  "dirty":["api"],
  "funding":{"program":"pocidif","placement":"footer","banners":["funding/eu.png","funding/guvern.png","funding/pocidif.png"],"text":"Proiect cofinanțat din …","identifiers":{"smisCode":"12345","projectTitle":"…","beneficiary":"…"}}} -->
```

- `paths`: every file the document covers, in every repo — `check-stale.mjs` diffs only those, so a covered file that is missing here never triggers an update.
- `dirty`: repos whose covered paths had uncommitted changes when the document was generated (empty array otherwise).
- `language` drives the cover labels and the table-of-contents title (built-in: en, ro, de, fr, es, it); `labels` overrides any of `module, company, audience, generated, contents, kicker, contract, project, beneficiary` for other languages or house style.
- `funding`: only for funded projects; `banners` are relative to `assets/brand/`; `placement` is `footer | header | both | cover`. The bars repeat on every page; the cover shows banners, sentence and identifiers.
- `footerText` (optional) replaces the company name in the page footer.
- `calls` (optional): names of other modules this one calls (`["payments","customers"]`) — feeds the module map in the index.

A full worked example is in `templates/examples/module-doc.md`.
