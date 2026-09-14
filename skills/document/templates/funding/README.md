# Funding references

Official assets for funded-project documents, one folder per programme, keyed like `programs.json`:

```
funding/
  programs.json        sources (official URLs), rules, required identifiers, default placement, confirmed banners
  pocidif/             eu.png, guvern.png, program.png      confirmed set (committed)
  pnrr/                eu-ngeu.png, guvern.png, pnrr.png    confirmed set (committed)
  <programme>/downloads/   raw packs, manuals, rasterised logos (git-ignored; recreated by `funding-assets.mjs fetch`)
```

- `node scripts/funding-assets.mjs list` — what is on file.
- `node scripts/funding-assets.mjs fetch <programme>` — download the official packs, unzip, rasterise `.ai`/`.pdf` logos, trim, print the recommended files.
- `node scripts/funding-assets.mjs confirm <programme> <file…> --by "<name>"` — copy the chosen files into the programme folder and record them; the wizard offers a confirmed set as the recommended option and still asks the user.

Manuals change: the sources were verified on 2026-09-14. When a programme publishes a new manual, run `fetch --force`, read the manual in `downloads/`, and re-confirm.
