---
name: check-mode
description: The --check argument only reports freshness and refreshes the index, without generating a document
tags: [smoke]
runs: 1
max_turns: 30
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Bash, Write, Skill]
---

/codebase-docs:document --check
