import { Locator, Page } from 'playwright';
import { baseUrl } from '../support/config';
import { InventoryPage } from './InventoryPage';

/**
 * Swag Labs login page (saucedemo.com root): "Login" form with username and password fields, and a
 * panel below listing the accepted demo usernames and the shared password.
 */
export class LoginPage {
    static readonly url = `${baseUrl}/`;

    /** "Username" text field, first field of the login form. */
    readonly usernameInput: Locator;
    /** "Password" text field, below Username. */
    readonly passwordInput: Locator;
    /** Green "Login" button at the bottom of the form. */
    readonly loginButton: Locator;
    /**
     * Red error banner that appears above the Login button after a failed attempt, e.g.
     * "Epic sadface: Sorry, this user has been locked out." Has an "X" (Dismiss error) button.
     */
    readonly errorMessage: Locator;

    constructor(private readonly page: Page) {
        this.usernameInput = page.getByRole('textbox', { name: 'Username' });
        this.passwordInput = page.getByRole('textbox', { name: 'Password' });
        this.loginButton = page.getByRole('button', { name: 'Login' });
        this.errorMessage = page.locator('[data-test="error"]');
    }

    /** Navigates to the login page. */
    async open() {
        await this.page.goto(LoginPage.url);
    }

    /**
     * Fills username and password (either may be empty) and clicks Login. Valid credentials navigate to
     * the "Products" inventory page; invalid ones keep the login page and show the error banner.
     */
    async login(username: string, password: string): Promise<InventoryPage> {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
        return new InventoryPage(this.page);
    }

    /** Text of the error banner, e.g. "Epic sadface: Username is required". */
    async getError(): Promise<string> {
        return this.errorMessage.innerText();
    }
}
