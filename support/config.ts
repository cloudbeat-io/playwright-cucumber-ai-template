// Settings for the application under test. Override with environment variables to point the
// suite at another environment without code changes, e.g. BASE_URL=https://staging.example.com npm test

/** Root URL of the application under test (no trailing slash). */
export const baseUrl = (process.env.BASE_URL ?? 'https://www.saucedemo.com').replace(/\/$/, '');

/**
 * Password used by the "I am logged in as {string}" step. saucedemo.com shows its demo password on the
 * login page; for a real app, set APP_PASSWORD in the environment (or CloudBeat) and never commit it.
 */
export const appPassword = process.env.APP_PASSWORD ?? 'secret_sauce';
