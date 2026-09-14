# Evals

Regression checks for the skill, run with `claude plugin eval` (needs `ANTHROPIC_API_KEY`; every run costs model calls).

```
cd <plugin root>
claude plugin eval . --case document-orders --runs 1 --max-cost-usd 5
```

Cases run inside a temporary copy of `evals/fixtures/` (two tiny repos, `web` and `api`, with an `orders` module). Results land in `evals/results/` (git-ignored). The graders check that the skill was invoked, that the Markdown and PDF exist, and that the document has the required sections; an LLM grader judges whether the summary explains what, why and how.
