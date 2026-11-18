# Playwright + Cucumber AI Template

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Playwright](https://img.shields.io/badge/Playwright-1.57-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev/)
[![Cucumber](https://img.shields.io/badge/CucumberJS-12-23D96C?logo=cucumber&logoColor=white)](https://github.com/cucumber/cucumber-js)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Runs on CloudBeat](https://img.shields.io/badge/runs%20on-CloudBeat-1B6AA4)](https://cloudbeat.io)

A ready-to-use boilerplate for BDD UI test automation with
[CucumberJS](https://github.com/cucumber/cucumber-js) + [Playwright](https://playwright.dev/) in
TypeScript, set up for AI coding agents ([Claude Code](https://claude.com/claude-code),
[Kiro](https://kiro.dev) and others that read `AGENTS.md`) and for running on [CloudBeat](https://cloudbeat.io).

The sample suite tests the [Swag Labs demo shop](https://www.saucedemo.com) — login, product catalog,
cart and checkout — so you can see every piece working before pointing it at your own application.

Created by the [CloudBeat](https://cloudbeat.io) team (CBNR Cloud Solutions LTD) and published for public use
under the [Apache License 2.0](LICENSE) — use it, fork it, and adapt it to your own projects.

## Why Gherkin + code, for AI agents

A test written only in code tells an agent *how* it clicks, but not *what* it is meant to prove.
Here every test has two layers:

```gherkin
Scenario: Buy one product
  Given I add "Sauce Labs Backpack" to the cart
  And I open the cart
  Then the cart contains "Sauce Labs Backpack"
  When I check out with first name "Jane", last name "Doe" and postal code "12345"
  Then the item total is 29.99
  When I finish the order
  Then the order confirmation "Thank you for your order!" is shown
```

- **The feature file** states the intent in plain language — the part people review and the agent
  must keep true.
- **Page objects and thin step definitions** hold the *how* — locators and actions, in one place
  per page.

An agent that records a new flow, fixes a broken locator or runs a manual test case can read the
intent, reuse existing steps, and change only the code that has to change. The conventions it
follows are written down in [`AGENTS.md`](AGENTS.md).

## What you get

- **Gherkin features + page objects + thin step definitions**, with documented conventions
  (`AGENTS.md`) that both humans and AI agents follow.
- **`/test-record`** — an agent skill that turns a recorded or described user flow into a Cucumber
  scenario, page objects and step definitions.
- **`/test-run-manual`** — an agent skill that runs a *manual* test case (from a file, Jira, or chat) in
  a live browser, asks the tester for missing data or help finding elements, shows progress, and
  writes an HTML/Markdown/JUnit report.
- **CloudBeat integration** — video, trace and screenshot attachments on failures when running on
  CloudBeat; remote browser support.
- **`/cloudbeat`** and **`/cloudbeat-results`** — connect the project to CloudBeat and upload it straight
  from your agent, run tests on CloudBeat, and ask about run results and failures.
- Debug helpers: headed by default, `SLOWMO`, `KEEP_OPEN`, `PWDEBUG`.

## Quick start

Requires Node.js 18+ and npm.

```bash
git clone https://github.com/cloudbeat-io/playwright-cucumber-ai-template.git
cd playwright-cucumber-ai-template
npm install                       # install dependencies
npx playwright install chromium   # install the Chromium browser
npm test                          # run the sample suite in a visible browser
```

Then open the folder in Claude Code or Kiro and try `/test-record` with a flow of your own.

## Running Tests

```bash
npm test                  # run the full suite
npm run test:saucedemo    # run only features/saucedemo
npm run test:smoke        # run only @smoke scenarios
HEADLESS=1 npm test       # without a visible browser (CI)
```

Run a single feature file or scenario directly:

```bash
npx cucumber-js features/saucedemo/checkout.feature
npx cucumber-js features/saucedemo/checkout.feature --name "Buy one product"
```

Tests run in a headed Chromium window by default so you can watch the browser as the scenario
executes. An HTML report is written to `reports/cucumber-report.html` after each run.

### Configuration

| Variable | Default | Purpose |
|---|---|---|
| `BASE_URL` | `https://www.saucedemo.com` | Root URL of the application under test |
| `APP_PASSWORD` | `secret_sauce` | Password for the `I am logged in as "<user>"` step |
| `HEADLESS` | off | `1` hides the browser |
| `SLOWMO` | `0` | Delay in ms before every browser action |
| `KEEP_OPEN` | off | `1` keeps the browser open after a failing scenario |

Defaults live in `support/config.ts`. Keep real credentials out of the repo — set them in the
environment or in CloudBeat.

## Debugging

### Slow the browser down — `SLOWMO`

`SLOWMO` adds a delay (in milliseconds) before every browser action — clicks, typing,
navigation — so you can watch each step happen.

```bash
SLOWMO=1000 npm run test:saucedemo
```

### Keep the browser open when a test fails — `KEEP_OPEN`

By default the browser closes at the end of every scenario. Set `KEEP_OPEN=1` to leave the window
on screen after a **failing** scenario so you can inspect the page (passing scenarios still close
normally). The test process will not exit while a window is open — close it or press `Ctrl+C`.

```bash
SLOWMO=1000 KEEP_OPEN=1 npm run test:saucedemo
```

> Tip: for a full step-by-step debugger, prefix any command with `PWDEBUG=1`
> (e.g. `PWDEBUG=1 npx cucumber-js features/saucedemo/login.feature`). This opens the Playwright
> Inspector, pauses before each action, and keeps the browser open.

## Working with an AI agent

The repo ships skills for both Claude Code (`.claude/skills/`) and Kiro (`.kiro/skills/`), plus the
project rules in `AGENTS.md`. Claude Code reads it through `CLAUDE.md`, Kiro through
`.kiro/steering/project.md`, and other agents (Codex, Cursor, GitHub Copilot, Gemini CLI, …) read it
directly; agents without skill support follow the `SKILL.md` files as plain instructions.

| Skill | What it does |
|---|---|
| `test-record` | Recording / chat description → `.feature` + page objects + step definitions, then runs the new scenario |
| `test-run-manual` | Executes a manual test case step by step in a visible browser and writes a test report |
| `playwright-cli` | Low-level browser control used by the two skills above |
| `cloudbeat-setup` | CloudBeat's own setup wizard (`/cloudbeat`, `/cloudbeat-sync`, `/cloudbeat-kit` in Claude Code): create the CloudBeat project, upload or Git-sync the code |
| `cloudbeat-results` | Runs suites or test cases on CloudBeat and answers questions about runs, results and failures |

### Record a new scenario

**Option A — record your own clicks (Playwright codegen)**

```bash
npm run record -- https://www.saucedemo.com
```

A browser and the Playwright Inspector open. Click through the flow; every action is written to
`recordings/codegen.js` (gitignored). Use the Inspector's assertion tools to capture expected results
too. Close the window when done, then ask the agent:

```
/test-record convert recordings/codegen.js into a scenario in features/saucedemo/checkout.feature
```

**Option B — describe the flow in chat**

```
/test-record Log in as standard_user, add the Sauce Labs Onesie to the cart, go to the cart,
remove it, and check that the cart is empty. Open the browser headed so I can watch.
```

The agent opens a browser session, performs the steps, harvests locators, writes the Gherkin, page
objects and any missing step definitions (reusing existing steps), and runs the new scenario.

### Run a manual test case

```
/test-run-manual
```

The agent asks where the test case is (file — txt, docx, pdf, xlsx… —, Jira issue, or pasted text),
lists the steps and asks for any missing test data, then runs them in a visible browser and shows
progress after each step:

```
[████████░░░░░░░░░░░░] 40%  4/10 steps  ✅ 4  ❌ 0  ⛔ 0  ⏭️ 0
Next: step 5 — Click "Checkout"
```

If it can't find an element, it asks you to mark it on the screen, click it in the browser, or
describe it. At the end it writes `report.md`, `report.html` and `junit.xml` (with screenshots) to
`test-results/<test-case>-<timestamp>/`. The JUnit file can be imported into other tools; the CloudBeat
CLI currently has no command for uploading results of tests run outside CloudBeat.

For Jira, either connect a Jira/Atlassian MCP server to your agent, or set `JIRA_BASE_URL`,
`JIRA_EMAIL` and `JIRA_API_TOKEN` in the environment.

### Using playwright-cli by hand

```bash
npx playwright-cli -s=rec open https://www.saucedemo.com --headed
npx playwright-cli -s=rec snapshot           # element refs (e.g. e11)
npx playwright-cli -s=rec fill e11 "standard_user"   # prints the equivalent Playwright code
npx playwright-cli -s=rec recording-start    # ...interact... then:
npx playwright-cli -s=rec recording-stop     # prints all recorded actions
npx playwright-cli -s=rec close
npx playwright-cli show                      # dashboard of all running sessions
```

CLI output (snapshots, logs) goes to `.playwright-cli/` (gitignored — it may contain credentials).

## Running on CloudBeat

The suite runs on CloudBeat as a CucumberJs project as-is. When the CloudBeat agent runs it
(`CB_AGENT` is set), `support/world.ts`:

- connects to the remote browser provided by CloudBeat (`PW_TEST_CONNECT_WS_ENDPOINT`),
- reports results through the `@cloudbeat/cucumber` formatter,
- attaches a screenshot to every failed step, and a trace and video to every failed scenario.

Don't hardcode `paths` or `tags` in `cucumber.js` — CloudBeat passes them itself.

### From your AI agent

The CloudBeat CLI does the work; the agent drives it. `npm i` installs it with the project (`npx cloudbeat-cli`),
so it works on closed networks without downloading anything else.

The first time, the agent asks whether to use CloudBeat cloud (`https://api.cloudbeat.io`, the default) or your
own CloudBeat installation, saves the URL in `~/.cloudbeat/config.json`, and asks you to log in. The API key is
typed into the CLI, never into the chat. To do the same by hand:

```bash
npm run cloudbeat:set-url -- https://cloudbeat.company.local   # your installation's API URL; or: default
npx cloudbeat-cli login                                          # asks for the API key only
npx cloudbeat-cli whoami                                         # check the connection
```

Behind a company certificate authority, set `NODE_EXTRA_CA_CERTS=/path/to/company-ca.pem` first.

| Ask | In Claude Code | What happens |
|---|---|---|
| Connect this project to CloudBeat | `/cloudbeat` | Checks the CloudBeat Kit (already set up in this template), creates the CloudBeat project (type `CucumberJs`), and delivers the code by Git integration or upload. Asks before creating anything. |
| Upload the latest code | `/cloudbeat-sync` | Git sync, or packs and uploads the folder (`.gitignore` is honored; `node_modules`, `.env*`, `.claude/` are never uploaded). |
| Run the smoke suite on CloudBeat | `/cloudbeat-results run suite "Smoke"` | Starts the suite, waits, saves a JUnit report to `test-results/cloudbeat/`, summarises failures and maps them to `features/`. |
| What failed in run 12345? | `/cloudbeat-results run 12345` | Fetches the result of that run and explains the failures. |

In Kiro and other agents, just ask in plain words — the `cloudbeat-setup` and `cloudbeat-results` skills
are listed in `AGENTS.md`. The project and delivery method are remembered in `.cloudbeat/setup.md` (no
secrets; safe to commit).

The CLI can't list past runs yet, so for questions about an earlier run give the agent its run id (it's
in the URL of the result page in CloudBeat).

## Project Structure

```
.
├── features/saucedemo/           # Gherkin feature files
│   ├── login.feature
│   ├── inventory.feature
│   └── checkout.feature
├── steps/                        # Thin step glue: page objects + assertions
│   ├── login.steps.ts
│   ├── inventory.steps.ts
│   └── checkout.steps.ts
├── pages/                        # One class per page; all locators live here
│   ├── components/HeaderComponent.ts
│   ├── components/FooterComponent.ts
│   ├── LoginPage.ts
│   ├── InventoryPage.ts
│   ├── CartPage.ts
│   ├── CheckoutInformationPage.ts
│   ├── CheckoutOverviewPage.ts
│   └── CheckoutCompletePage.ts
├── support/
│   ├── config.ts                 # BASE_URL, credentials
│   └── world.ts                  # Browser per scenario, CloudBeat hooks, debug options
├── scripts/cloudbeat-set-url.mjs # Saves the CloudBeat URL for the CLI (custom / self-hosted CloudBeat)
├── .claude/skills/               # Claude Code skills (test-record, test-run-manual, cloudbeat-results,
│                                 #   playwright-cli, cloudbeat-setup)
├── .claude/commands/             # /cloudbeat, /cloudbeat-sync, /cloudbeat-kit (installed by the CloudBeat CLI)
├── .claude/settings.json         # Blocks agents from reading ~/.cloudbeat (API key)
├── .kiro/skills/                 # Kiro copies of the same skills
├── .kiro/steering/project.md     # Points Kiro to AGENTS.md
├── AGENTS.md                     # Project rules for all AI agents (and humans)
├── CLAUDE.md                     # Imports AGENTS.md + Claude Code specifics
├── LICENSE                       # Apache 2.0
├── NOTICE                        # Copyright and attribution
├── cucumber.js                   # Cucumber configuration
├── tsconfig.json
└── package.json
```

Generated, gitignored: `reports/` (Cucumber HTML report, CloudBeat attachments), `test-results/`
(manual test runs, CloudBeat run reports), `recordings/` (codegen output), `.playwright-cli/`.

### How the pieces fit together

- **Feature files** describe *what* to test, in Gherkin (`Given / When / Then`).
- **Step definitions** map each Gherkin line to code. They stay thin: create a page object, call it,
  assert with `expect`.
- **Page objects** know *how* to find and use elements on one page. Every locator and method has a
  short description of what it is on the page.
- **Support** (`support/world.ts`) launches a browser and page before each scenario and cleans up
  afterwards.

## Adapting the template to your application

1. Set `BASE_URL` (or change the default in `support/config.ts`) to your application.
2. Replace `features/saucedemo/`, the saucedemo page objects and step definitions with your own —
   the fastest way is `/test-record` with a description of your first flow.
3. Update `AGENTS.md` (intro, commands, locator fallback attribute) and the `package.json`
   name/scripts.
4. Update the examples in `.claude/skills/test-record/SKILL.md` (and the Kiro copy) if you want the
   agent to see examples from your own app.

## Adding a Step Definition by hand

```ts
import { When } from '@cucumber/cucumber';
import { CbWorld } from '../support/world';
import { InventoryPage } from '../pages/InventoryPage';

When('I sort products by {string}', async function (this: CbWorld, option: string) {
    await new InventoryPage(this.page).sortBy(option);
});
```

- `{string}`, `{int}` and `{float}` capture values from the Gherkin step and pass them as arguments.
- `this.page` is the Playwright page created by `support/world.ts`.
- Keep the step text identical between the `.feature` file and the step definition — Cucumber
  matches them by that text. If a step has no definition, Cucumber prints a suggested snippet.

## License

Licensed under the [Apache License, Version 2.0](LICENSE). Copyright 2026 CBNR Cloud Solutions LTD.
Created by the [CloudBeat](https://cloudbeat.io) team for public use; see [NOTICE](NOTICE).

"CloudBeat" and the CloudBeat logo are trademarks of CBNR Cloud Solutions LTD. The license does not
grant permission to use them, other than to describe where this template comes from.
