---
name: test-record
description: Turn a browser recording (Playwright codegen output or a playwright-cli session) or a chat description of a user flow into a Cucumber scenario in this repo — a .feature file, a page object class for every page in the flow, and any missing step definitions. Use when the user asks to record, add, or generate a new test scenario.
---

# Record a new Cucumber scenario

The output of this workflow is always **Gherkin + page objects + step definitions**, never a Playwright
Test `.spec.ts` file. The generic `playwright-cli` skill describes a plan → generate → heal flow for
Playwright Test (`npx playwright test --debug=cli`, `tests/seed.spec.ts`); that runner is **not** used
here. Use `playwright-cli` only to drive the browser and harvest locators, then follow the steps below.

## 1. Pick the input

| Input | What to do |
|---|---|
| `recordings/codegen.js` exists (user ran `npm run record -- <url>`) | Read it. Each line is one user action. Go to step 3. |
| User pasted Playwright code | Treat it like a codegen file. Go to step 3. |
| User describes the flow in chat ("log in, add the backpack to the cart, …") | Drive it yourself — step 2. |
| User wants to click through it themselves while you watch | Step 2, but open `--headed`, run `recording-start`, let the user act, then `recording-stop`. |

## 2. Drive the browser with playwright-cli (chat-driven)

Use a named session so you don't collide with anything else the user has open. The app's root URL is
`baseUrl` in `support/config.ts`:

```bash
playwright-cli -s=rec open https://www.saucedemo.com      # add --headed if the user wants to watch
playwright-cli -s=rec recording-start
playwright-cli -s=rec snapshot            # or: find "<visible text>" to get refs without dumping the whole tree
playwright-cli -s=rec fill e11 "standard_user"
playwright-cli -s=rec click e15
playwright-cli -s=rec recording-stop      # prints all recorded actions as Playwright code
playwright-cli -s=rec close
```

- Start from the state the feature's `Background:` leaves the page in (e.g. "logged in as
  standard_user" in `features/saucedemo/checkout.feature`). Don't record those steps again.
- On large pages prefer `find "<text>"` or `snapshot --filename=...` + `grep` over printing a full
  snapshot.
- For each expected outcome, get a locator and the real value:
  `playwright-cli --raw generate-locator <ref>`, `playwright-cli --raw eval "el => el.textContent" <ref>`.
- Note every distinct page the flow passes through (URL / screen). Each one needs a page object (step 4).
- **While recording, capture a short description of every element you touch or assert on**, taken
  from the snapshot: its role, visible label/text (plus an English translation when the UI is in
  another language), and where it sits (section heading, form, header/footer). Also note what each
  action does on the page (shows results, opens a modal, navigates). These become the page object
  comments in step 4.
- Always `close` the session when done.

## 3. Map actions to Gherkin

1. Read every file in `steps/` first. **Reuse an existing step whenever its text fits**,
   even if the recorded locator differs slightly — don't create near-duplicates.
2. Group raw actions into business-level steps: filling username + password + clicking Login is one
   step (`When I log in as "standard_user" with password "secret_sauce"`), not three.
3. Turn literal values into parameters (`{string}`, `{int}`, `{float}`) so the step is reusable.
4. Every scenario needs at least one `Then` with a real assertion. Recordings contain actions only —
   add the assertion yourself from what the page shows after the last action.
5. Put the scenario in an existing feature file if it belongs to that area (it inherits its
   `Background:`); otherwise create `features/<area>/<name>.feature`. Tag it (`@smoke`, `@ui`,
   `@validation`, …) consistently with neighbours.

## 4. Create or update a page object for every page in the flow (mandatory)

**Every page the recorded flow touches must have a page object class in `pages/`.** This is
not optional: a scenario is not done until each of its pages has one.

1. List the pages from step 2 (or from the `goto`/navigation lines of the codegen file).
2. For each page, look in `pages/` first. If a class exists, **extend it** with the new
   locators/actions; don't create a second class for the same page.
3. Otherwise create `pages/<PageName>Page.ts` with one class named `<PageName>Page`
   (PascalCase, in English, e.g. `CheckoutOverviewPage`). Reusable parts that appear on several pages
   (header, cookie banner, modal) get their own component class, e.g.
   `pages/components/HeaderComponent.ts`.

Template (see `pages/LoginPage.ts` for the real one):

```ts
import { Locator, Page } from 'playwright';
import { baseUrl } from '../support/config';
import { InventoryPage } from './InventoryPage';

/** Swag Labs login page: "Login" form with username and password fields. */
export class LoginPage {
    static readonly url = `${baseUrl}/`;

    /** "Username" text field, first field of the login form. */
    readonly usernameInput: Locator;
    /** "Password" text field, below Username. */
    readonly passwordInput: Locator;
    /** Green "Login" button at the bottom of the form. */
    readonly loginButton: Locator;

    constructor(private readonly page: Page) {
        this.usernameInput = page.getByRole('textbox', { name: 'Username' });
        this.passwordInput = page.getByRole('textbox', { name: 'Password' });
        this.loginButton = page.getByRole('button', { name: 'Login' });
    }

    /** Navigates to the login page. */
    async open() {
        await this.page.goto(LoginPage.url);
    }

    /** Fills the credentials and clicks Login; valid ones navigate to the "Products" page. */
    async login(username: string, password: string): Promise<InventoryPage> {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
        return new InventoryPage(this.page);
    }
}
```

Rules:

- **Every locator, method and the class itself gets a `/** ... */` description comment.** Use the
  notes from recording (step 2):
  - **Elements:** what it is and where it is: role, visible label or text (plus an English
    translation if the UI isn't in English), section. E.g. `/** "Sort products" dropdown at the top right of the Products page. */`
  - **Actions:** what the user does and what visibly happens: results appear, a modal opens, it
    navigates to another page. Mention input format and allowed values when relevant.
  - **Reads:** what value is returned and in what form (e.g. "order total as a number, `$` and
    thousands separators removed").
  - **Quirks:** anything non-obvious you noticed (e.g. "the "Add to cart" button turns into "Remove"
    after clicking").
  - Describe the page, not the implementation. Keep it to one or two lines.
- **All locators live in page objects.** Declare them as `readonly` `Locator` fields set in the
  constructor (or as methods when they take a parameter, e.g. `addToCartButton(name: string)`).
- Public methods are business-level actions (`login`, `addToCart`) or reads that return plain
  values (`getTotal(): Promise<number>`). Name them after what the user does, not the DOM.
- **No assertions in page objects.** No `expect` there; assertions belong in `Then` steps. Methods may
  wait for the state they produce (e.g. `waitFor()` on a result), but must not decide pass or fail.
- The constructor takes the Playwright `Page`; never launch a browser or create a page there.
- Locator choice: prefer role/label locators as emitted by playwright-cli/codegen (`getByRole`,
  `getByLabel`); fall back to the app's test attribute (`[data-test="..."]` on saucedemo) or
  `[id="..."]` when there is no accessible name. Copy UI text exactly from the page, in whatever
  language it is.
- URLs are built from `baseUrl` (`support/config.ts`), never hardcoded hosts.
- Methods that navigate to another page return that page's object (`async checkout(): Promise<CheckoutInformationPage>`).

## 5. Write missing step definitions

Step definitions are thin glue: they create the page object from `this.page`, call its methods, and
assert. **They must not contain raw locators** (`this.page.locator(...)`, `this.page.getByRole(...)`).

```ts
import { Given, Then } from '@cucumber/cucumber';
import { expect } from 'playwright/test';
import { CbWorld } from '../support/world';
import { InventoryPage } from '../pages/InventoryPage';

Given('I add {string} to the cart', async function (this: CbWorld, product: string) {
    await new InventoryPage(this.page).addToCart(product);
});

Then('the catalog shows {int} products', async function (this: CbWorld, count: number) {
    await expect(new InventoryPage(this.page).productCards).toHaveCount(count);
});
```

- `this: CbWorld`, use `this.page` (never create a browser/page — `support/world.ts` does that).
  To pass a value between steps, store it in `this.remembered`.
- `expect` from `playwright/test`.
- No `waitForTimeout` / sleeps, no `networkidle`. Rely on Playwright auto-waiting and `expect`.
- New page area → new file `steps/<area>.steps.ts`.
- If you touch an existing step that still uses raw locators, move those locators into the page object
  as part of the change.

## 6. Verify

```bash
npx tsc --noEmit                         # also type-checks pages/
grep -nE "this\.page\.(locator|getBy)" steps/   # must print nothing for the steps you wrote
npx cucumber-js features/<area>/<file>.feature --name "<scenario name>"
```

Tests run headed by default (`HEADLESS=1` to hide the browser, see `support/world.ts`). If a step
fails, re-open a `playwright-cli` session at that point, inspect with `snapshot`/`find`, fix the
locator in the page object, rerun. Report the final pass/fail honestly.

## 7. Clean up

Delete `recordings/codegen.js` once its content is converted (the folder is gitignored anyway) and make
sure no `playwright-cli` sessions are left running (`playwright-cli list`).
