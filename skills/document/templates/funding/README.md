# Funding references

Drop here the official assets of each funding programme you document under: logos/banners (PNG or SVG, on white) and the wording the programme's visual-identity manual requires. One folder per programme, named by its key in `programs.json`:

```
funding/
  programs.json
  pnrr/            eu-nextgenerationeu.png, guvern.png, pnrr.png …
  poc-2014-2020/   eu.png, guvern.png, instrumente-structurale.png …
```

`programs.json` holds, per programme: the banner files in display order, the mandatory sentence(s), which identifiers are required (SMIS code, contract number, project title, beneficiary), and the default placement. The wizard reads it; when a programme, a banner or a required identifier is missing, the skill **asks and waits** — it never produces a funded-project document with incomplete or guessed funding data.
