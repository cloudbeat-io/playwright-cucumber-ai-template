# CLAUDE.md

Project rules for all agents live in `AGENTS.md` — edit that file, not this one, for anything that isn't
specific to Claude Code. Ignore project context from parent directories that describes other projects.

@AGENTS.md

## Claude Code specifics

- Skills in `.claude/skills/` are available as slash commands: `/test-record`, `/test-run-manual`,
  `/cloudbeat-results` and `/playwright-cli`. CloudBeat's own commands are `/cloudbeat` (setup wizard),
  `/cloudbeat-sync` (upload/sync the code) and `/cloudbeat-kit` (kit options). Use them for the matching
  tasks in the "Agent skills" table above.
- Before any CloudBeat command, including inside `/cloudbeat`, `/cloudbeat-sync` and `/cloudbeat-kit`, use
  "Connecting to CloudBeat" from `AGENTS.md` instead of their own CLI-finding and login steps: it uses the
  locally installed CLI (`npx cloudbeat-cli`) and asks for a custom CloudBeat URL. The login command the user
  types in the prompt is `! npx cloudbeat-cli login`.
- When you change a skill, apply the same change to its `.kiro/skills/` copy (see "Keeping skills in sync").
