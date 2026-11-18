# AGENTS.md — Test automation AI template (CucumberJS + Playwright)

Instructions for AI coding agents (and humans) working in this repo. This file is the single source of
truth: Claude Code reads it through `CLAUDE.md`, Kiro through `.kiro/steering/project.md`, and other
agents (Codex, Cursor, GitHub Copilot, Gemini CLI, …) read it directly. Ignore project context from
parent directories that describes other projects.

This repo is a CucumberJS + Playwright (TypeScript) UI test suite template. The sample tests target the
Swag Labs demo shop (https://www.saucedemo.com). It runs locally and on CloudBeat.

## Commands

```bash
npm test                                   # all features
npm run test:saucedemo                     # features/saucedemo only
npm run test:smoke                         # @smoke scenarios only
npx cucumber-js features/saucedemo/checkout.feature --name "Buy one product"   # one scenario
npx tsc --noEmit                           # type-check
HEADLESS=1 npm test                        # no visible browser
SLOWMO=1000 KEEP_OPEN=1 npm run test:saucedemo  # debug (see README)
BASE_URL=https://staging.example.com npm test   # another environment
```

## Layout

- `features/**/*.feature` — Gherkin scenarios. Shared setup goes in `Background:`.
- `steps/**/*.ts` — step implementations; `function (this: CbWorld, ...)`. Thin glue: build
  page objects from `this.page`, call them, assert.
- `pages/<PageName>Page.ts` — one page object class per page (`pages/components/` for parts
  shared across pages). All locators live here.
- `support/config.ts` — `baseUrl` and credentials, overridable by env vars (`BASE_URL`, `APP_PASSWORD`).
  Never hardcode hosts or secrets elsewhere.
- `support/world.ts` — launches the browser per scenario, CloudBeat hooks (video/trace/screenshots when
  `CB_AGENT` is set). Don't launch browsers from step files. `this.remembered` passes values between steps.
- `cucumber.js` — runner config. Do not hardcode `paths`/`tags` there (breaks CloudBeat runs).

## Page objects (mandatory)

- Every page used by a scenario must have a page object class in `pages/`, named
  `<PageName>Page` in `<PageName>Page.ts` (e.g. `CheckoutOverviewPage`). When recording a new flow, create
  one for **each page the flow passes through**, or extend the existing class for that page — never two
  classes for one page.
- Locators are `readonly Locator` fields set in the constructor (`constructor(private readonly page: Page)`);
  methods are business-level actions or reads that return plain values. Navigation methods return the
  next page's object.
- No `expect` in page objects — assertions belong in `Then` steps.
- Every page object class, locator and method has a `/** ... */` description comment written from what
  was seen while recording:
  - **elements:** role, visible label (plus an English translation if the UI isn't in English), and
    location on the page;
  - **actions:** what the user does and what visibly happens;
  - **reads:** what is returned and in what format.
- Step definitions must not contain raw locators (`this.page.locator(...)` / `this.page.getBy...(...)`).
  When editing a step that still has them, move them into the page object.

## Conventions

- Reuse existing step text before adding a new step; parameterise values with `{string}`/`{int}`/`{float}`.
- `expect` comes from `playwright/test`.
- Locators: prefer `getByRole`/`getByLabel`/`getByText`; fall back to the app's test attribute
  (`[data-test="..."]` on saucedemo) or `[id="..."]`. Copy UI text exactly.
- No fixed sleeps (`waitForTimeout`) and no `networkidle`; rely on auto-wait and `expect`.
- Every scenario ends with at least one real assertion.
- Output is always a `.feature` + page objects + step definitions — never a Playwright Test `.spec.ts`.

## Agent skills (workflows)

The workflows below are written as skills. Follow the matching `SKILL.md` whenever the task fits, even if
your tool has no skill support — read the file and follow it as instructions.

| Task | Skill | Claude Code | Kiro and other agents (tool-neutral wording) |
|---|---|---|---|
| Record or add a test scenario (from codegen output, a playwright-cli session, or a described flow) | `test-record` | `.claude/skills/test-record/SKILL.md` | `.kiro/skills/test-record/SKILL.md` |
| Run a manual test case (file, Jira or pasted text) in a browser and produce a report | `test-run-manual` | `.claude/skills/test-run-manual/SKILL.md` | `.kiro/skills/test-run-manual/SKILL.md` |
| Drive a browser from the terminal (used by both skills above) | `playwright-cli` | `.claude/skills/playwright-cli/SKILL.md` | `.kiro/skills/playwright-cli/SKILL.md` |
| Connect the project to CloudBeat (kit, project, first upload), upload/sync the latest code, change kit options | `cloudbeat-setup` | `/cloudbeat`, `/cloudbeat-sync`, `/cloudbeat-kit` (`.claude/commands/`) and `.claude/skills/cloudbeat-setup/` | `.kiro/skills/cloudbeat-setup/SKILL.md` (points to the same files) |
| Run tests on CloudBeat; status, results and failures of a CloudBeat run | `cloudbeat-results` | `.claude/skills/cloudbeat-results/SKILL.md` | `.kiro/skills/cloudbeat-results/SKILL.md` |

Tools used by these workflows (both devDependencies):

- **Playwright codegen** (`npm run record -- <url>`) — the user clicks through a flow in a browser
  window; actions are saved to `recordings/codegen.js` (gitignored).
- **playwright-cli** (`npx playwright-cli`) — drives a browser from the terminal, takes accessibility
  snapshots, and emits Playwright code for every action (`recording-start` / `recording-stop`). Keep
  sessions named (`-s=<name>`) and close them when done.

`test-run-manual` uses the session name `manual` and writes `report.md` / `report.html` / `junit.xml`
to `test-results/<run>/` (gitignored).

All CloudBeat operations go through the CloudBeat CLI. Never ask for an API key or token in the chat: the
user runs the login command themselves. `.cloudbeat/setup.md` records the CloudBeat project and contains
no secrets.

### Connecting to CloudBeat (all CloudBeat skills)

This procedure replaces "Find the CLI" and the login part of `cloudbeat-setup`'s
`questions/01-connect.md`. It works on closed networks with a self-hosted CloudBeat.

**Never read, print or edit `~/.cloudbeat/config.json` yourself** — it contains the API key. Use
`node scripts/cloudbeat-set-url.mjs --show` (prints the stored URL, never the key) and the CLI.

1. **CLI:** use `npx cloudbeat-cli` — `@cloudbeat/cli` is a devDependency, so `npm i` installs it and no
   internet access is needed. If it's missing, ask the user to run `npm i`. A global `cloudbeat-cli` is
   fine too. Don't use `npx -y @cloudbeat/cli` here: on a fresh machine it downloads from the npm registry.
2. `npx cloudbeat-cli --json whoami`:
   - `ok: true` and `verified: true` → tell the user which instance (`apiBaseUrl`) they're connected to and
     continue. Skip the rest.
   - `not_logged_in`, `invalid_api_key`, or `error` (e.g. `ETIMEDOUT`, `ECONNREFUSED`, `ENOTFOUND`, a
     certificate error — the stored URL is wrong or unreachable) → continue with step 3.
3. **Ask which CloudBeat to use.** First run `node scripts/cloudbeat-set-url.mjs --show`. Then ask (a
   multiple-choice question):
   - "CloudBeat cloud — https://api.cloudbeat.io (default)"
   - "Our own CloudBeat installation (custom URL)" → then ask for its **API URL**, e.g.
     `https://cloudbeat.company.local` or `http://10.0.0.5:8080` (their CloudBeat administrator knows it).
   - When `--show` reports `isDefault: false`, also offer "Keep <apiBaseUrl>" — but if `whoami` failed
     with a network error, say that this URL just failed.
   If `--show` reports `envApiUrl`, the `CB_API_URL` environment variable overrides the stored URL — mention it.
4. **Store it:** `node scripts/cloudbeat-set-url.mjs <url>` (or `default`). It writes `apiBaseUrl` to
   `~/.cloudbeat/config.json` (the CLI's own config file) and checks the server is reachable. Read its JSON:
   - `apiKeyRemoved: true` → tell the user the stored key belonged to another instance and was removed.
   - `reachable: false` → show `reachError` and help: `ENOTFOUND` = wrong host name / DNS;
     `ECONNREFUSED` = wrong port or server down; timeout = firewall, VPN or proxy (`HTTPS_PROXY` /
     `NO_PROXY`); `SELF_SIGNED_CERT_IN_CHAIN` / `UNABLE_TO_VERIFY_LEAF_SIGNATURE` = company certificate
     authority → `export NODE_EXTRA_CA_CERTS=/path/to/company-ca.pem` before running the CLI. Never
     disable TLS verification. Offer to correct the URL or continue anyway.
5. **Log in:** ask the user to run `npx cloudbeat-cli login` themselves (in Claude Code: type
   `! npx cloudbeat-cli login` in the prompt). It uses the stored URL and asks only for the API key (from
   their CloudBeat user profile) with hidden input, then saves it in the same config file.
6. `npx cloudbeat-cli --json whoami` again. `verified: true` → done. `invalid_api_key` → the key is wrong
   or from another CloudBeat instance; repeat step 5.

**Keeping skills in sync:** each skill exists in `.claude/skills/` and `.kiro/skills/`. The Kiro copies
omit the `allowed-tools` frontmatter line and use tool-neutral wording instead of Claude Code tool names;
`test-run-manual` also has its own copy of `scripts/report.mjs`. When changing a skill, update both copies.
Exception: `cloudbeat-setup` and the `/cloudbeat*` commands belong to CloudBeat and are installed and
updated by `npx cloudbeat-cli init --agent claude` (add `--force` to replace locally modified files) — don't edit them by hand; the Kiro skill only points
to them.

## License

Apache License 2.0 (see `LICENSE` and `NOTICE`), copyright CBNR Cloud Solutions LTD (CloudBeat). Keep
`NOTICE` intact. Don't add license headers to new source files.
