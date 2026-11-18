---
name: cloudbeat-setup
description: Set up CloudBeat for this test automation project - install and configure the CloudBeat Kit, create a project in CloudBeat, and deliver the code via Git integration or file upload; also re-synchronize (upload) the latest code or change the kit options later. Use when the user asks to set up, connect or integrate CloudBeat, create a CloudBeat project, or upload/sync tests to CloudBeat.
---

# CloudBeat setup, sync and kit (Kiro)

The CloudBeat setup wizard is maintained by CloudBeat and installed by its CLI
(`npx cloudbeat-cli init --agent claude`) into `.claude/`. Kiro uses the same files — don't copy them
here, so they stay current when the CLI updates them.

| User wants | Follow |
|---|---|
| Full setup: kit, CloudBeat project, first code delivery (or continue an unfinished setup) | `.claude/commands/cloudbeat.md` |
| Upload / synchronize the latest code to an existing CloudBeat project | `.claude/commands/cloudbeat-sync.md` |
| Install the CloudBeat Kit or change its options | `.claude/commands/cloudbeat-kit.md` |

Each of these reads `.claude/skills/cloudbeat-setup/SKILL.md` (ground rules, phases) and the files next to
it. Read them from there and follow them exactly, with these adjustments:

- Connect with "Connecting to CloudBeat" in `AGENTS.md` instead of their own CLI-finding and login steps:
  it uses the locally installed CLI (`npx cloudbeat-cli`, works without internet) and asks whether to use
  the default CloudBeat cloud or a custom CloudBeat URL. Use `npx cloudbeat-cli` wherever they say
  `cloudbeat-cli` or `npx -y @cloudbeat/cli`.

- Where they say the user should type `! <command>` (e.g. `! cloudbeat-cli login`), ask the user to run
  `<command>` in their own terminal instead. Secrets are still never typed into the chat.
- Where they mention slash commands (`/cloudbeat`, `/cloudbeat-sync`, `/cloudbeat-kit`), offer the
  matching row of the table above.
