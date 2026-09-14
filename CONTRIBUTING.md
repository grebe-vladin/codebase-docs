# Contributing

Thanks for helping. This plugin has no build step: the skill is Markdown, the tooling is small Node and Bash scripts.

## Ground rules

- **The HTML diagram is the source of truth.** Image models may polish it; they never replace it.
- **The skill reads its own output back** (PDF pages, PNGs) before it reports. Keep that loop intact.
- **No credential is ever stored** by the plugin: API keys come from the environment only.
- **Funding assets are official material.** Add a programme only with its banners and the wording from its visual-identity manual.

## Before opening a pull request

```
bash skills/document/scripts/doctor.sh
for f in skills/document/scripts/*.sh; do bash -n "$f"; done
for f in skills/document/scripts/*.mjs; do node --check "$f"; done
node skills/document/scripts/build-pdf.mjs examples/orders/orders.md
bash skills/document/scripts/pdf-pages.sh examples/orders/orders.pdf /tmp/pages
claude plugin validate .
```

Look at `/tmp/pages/page-*.png` after a change to the templates or the build script. Update `examples/orders/` when the output format changes, and keep the example fictional and generic.

## Reporting issues

Include the doctor output, the OS, and the part of the output that looked wrong (a page PNG or a diagram). Never paste real client data or funding identifiers.
