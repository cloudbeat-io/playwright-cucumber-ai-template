import { Locator, Page } from 'playwright';
import { HeaderComponent } from './components/HeaderComponent';
import { CheckoutInformationPage } from './CheckoutInformationPage';
import { InventoryPage } from './InventoryPage';

/**
 * "Your Cart" page (/cart.html): list of cart items (QTY, name, description, price, "Remove" button) and
 * "Continue Shopping" / "Checkout" buttons at the bottom.
 */
export class CartPage {
    readonly header: HeaderComponent;
    /** Item rows in the cart list. */
    readonly items: Locator;
    /** Item names in the cart list, e.g. "Sauce Labs Backpack". */
    readonly itemNames: Locator;
    /** "Continue Shopping" button at the bottom left; returns to the Products page. */
    readonly continueShoppingButton: Locator;
    /** Green "Checkout" button at the bottom right; opens "Checkout: Your Information". */
    readonly checkoutButton: Locator;

    constructor(private readonly page: Page) {
        this.header = new HeaderComponent(page);
        this.items = page.locator('[data-test="inventory-item"]');
        this.itemNames = page.locator('[data-test="inventory-item-name"]');
        this.continueShoppingButton = page.getByRole('button', { name: 'Continue Shopping' });
        this.checkoutButton = page.getByRole('button', { name: 'Checkout' });
    }

    /** Clicks "Remove" on the cart row of the given item; the row disappears. */
    async removeItem(name: string) {
        await this.items.filter({ hasText: name }).getByRole('button', { name: 'Remove' }).click();
    }

    /** Clicks "Continue Shopping"; navigates back to the Products page. */
    async continueShopping(): Promise<InventoryPage> {
        await this.continueShoppingButton.click();
        return new InventoryPage(this.page);
    }

    /** Clicks "Checkout"; navigates to the "Checkout: Your Information" form. */
    async checkout(): Promise<CheckoutInformationPage> {
        await this.checkoutButton.click();
        return new CheckoutInformationPage(this.page);
    }

    /** Names of the items in the cart, in list order. */
    async getItemNames(): Promise<string[]> {
        return this.itemNames.allInnerTexts();
    }
}
