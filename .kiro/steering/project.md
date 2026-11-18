---
inclusion: always
---

# Project rules

The project rules are shared by all AI agents and live in `AGENTS.md` in the repo root. Follow them for
layout, page object rules, conventions, and how to record scenarios or run manual test cases:

#[[file:AGENTS.md]]

Kiro skills are in `.kiro/skills/` (`test-record`, `test-run-manual`, `playwright-cli`, `cloudbeat-setup`,
`cloudbeat-results`). When you change a skill, apply the same change to its `.claude/skills/` copy —
except `cloudbeat-setup`, which only points to CloudBeat's own wizard files in `.claude/`.

When any instructions tell the user to type `! <command>` (a Claude Code feature), ask them to run
`<command>` in their own terminal instead.
