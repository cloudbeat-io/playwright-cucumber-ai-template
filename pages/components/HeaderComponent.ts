import { Locator, Page } from 'playwright';
import { CartPage } from '../CartPage';
import { LoginPage } from '../LoginPage';

/**
 * Swag Labs header shown on every page after login: "Open Menu" (burger) button and side menu on the
 * left, cart icon with item-count badge on the right, and the page title below ("Products", "Your Cart", …).
 */
export class HeaderComponent {
    /** Burger "Open Menu" button at the top left; opens the side menu. */
    readonly menuButton: Locator;
    /** "Logout" button in the side menu (visible only while the menu is open). */
    readonly logoutButton: Locator;
    /**
     * Cart icon at the top right. Its accessible name reflects the content: "Cart, empty" or
     * "Cart, 2 items".
     */
    readonly cartButton: Locator;
    /** Red badge on the cart icon with the number of items; not rendered when the cart is empty. */
    readonly cartBadge: Locator;
    /** Page title under the header bar, e.g. "Products", "Your Cart", "Checkout: Overview". */
    readonly title: Locator;

    constructor(private readonly page: Page) {
        this.menuButton = page.getByRole('button', { name: 'Open Menu' });
        this.logoutButton = page.getByRole('button', { name: 'Logout' });
        this.cartButton = page.getByRole('button', { name: /^Cart,/ });
        this.cartBadge = page.locator('[data-test="shopping-cart-badge"]');
        this.title = page.locator('[data-test="title"]');
    }

    /** Opens the side menu and clicks Logout; the app returns to the login page. */
    async logout(): Promise<LoginPage> {
        await this.menuButton.click();
        await this.logoutButton.click();
        return new LoginPage(this.page);
    }

    /** Clicks the cart icon; navigates to the "Your Cart" page. */
    async openCart(): Promise<CartPage> {
        await this.cartButton.click();
        return new CartPage(this.page);
    }

    /** Page title text, e.g. "Products". */
    async getTitle(): Promise<string> {
        return this.title.innerText();
    }

    /** Number shown on the cart badge, or 0 when the badge is not shown (empty cart). */
    async getCartCount(): Promise<number> {
        if (!(await this.cartBadge.isVisible())) {
            return 0;
        }
        return Number(await this.cartBadge.innerText());
    }
}
