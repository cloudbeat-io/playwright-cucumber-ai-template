import { Locator, Page } from 'playwright';
import { baseUrl } from '../support/config';
import { HeaderComponent } from './components/HeaderComponent';

/**
 * "Products" inventory page shown after login (/inventory.html): a sort dropdown at the top right and a
 * grid of product cards, each with image, name, description, price and an "Add to cart"/"Remove" button.
 */
export class InventoryPage {
    static readonly url = `${baseUrl}/inventory.html`;

    readonly header: HeaderComponent;
    /**
     * "Sort products" dropdown at the top right, options: "Name (A to Z)" (default), "Name (Z to A)",
     * "Price (low to high)", "Price (high to low)".
     */
    readonly sortDropdown: Locator;
    /** Every product card in the grid. */
    readonly productCards: Locator;
    /** Product name links on the cards, in display order, e.g. "Sauce Labs Backpack". */
    readonly productNames: Locator;
    /** Product prices on the cards, in display order, e.g. "$29.99". */
    readonly productPrices: Locator;
    /** Short description text under each product name, in display order. */
    readonly productDescriptions: Locator;
    /** Label of the currently selected sort option, shown inside the "Sort products" dropdown, e.g. "Name (A to Z)". */
    readonly activeSortOption: Locator;

    constructor(private readonly page: Page) {
        this.header = new HeaderComponent(page);
        this.sortDropdown = page.getByRole('combobox', { name: 'Sort products' });
        this.productCards = page.locator('[data-test="inventory-item"]');
        this.productNames = page.locator('[data-test="inventory-item-name"]');
        this.productPrices = page.locator('[data-test="inventory-item-price"]');
        this.productDescriptions = page.locator('[data-test="inventory-item-desc"]');
        this.activeSortOption = page.locator('[data-test="active-option"]');
    }

    /** Product card whose name is exactly `name`. */
    productCard(name: string): Locator {
        return this.productCards.filter({
            has: this.page.locator('[data-test="inventory-item-name"]').getByText(name, { exact: true }),
        });
    }

    /** Product photo on a product card; its alt text is the product name. */
    productImage(name: string): Locator {
        return this.productCard(name).getByRole('img', { name, exact: true });
    }

    /** Description text under the product name on a product card. */
    productDescription(name: string): Locator {
        return this.productCard(name).locator('[data-test="inventory-item-desc"]');
    }

    /** "Add to cart" button on a product card; after clicking, the same spot shows "Remove". */
    addToCartButton(name: string): Locator {
        return this.productCard(name).getByRole('button', { name: 'Add to cart' });
    }

    /** "Remove" button on a product card that is already in the cart. */
    removeButton(name: string): Locator {
        return this.productCard(name).getByRole('button', { name: 'Remove' });
    }

    /** Clicks "Add to cart" on the product; the button turns into "Remove" and the cart badge increases. */
    async addToCart(name: string) {
        await this.addToCartButton(name).click();
    }

    /** Clicks "Remove" on the product; the button turns back into "Add to cart" and the badge decreases. */
    async removeFromCart(name: string) {
        await this.removeButton(name).click();
    }

    /** Picks a sort option by its visible label, e.g. "Price (low to high)"; the grid re-orders at once. */
    async sortBy(label: string) {
        await this.sortDropdown.selectOption({ label });
    }

    /** Product names in display order. */
    async getProductNames(): Promise<string[]> {
        return this.productNames.allInnerTexts();
    }

    /** Product prices in display order as numbers ("$29.99" → 29.99). */
    async getProductPrices(): Promise<number[]> {
        const texts = await this.productPrices.allInnerTexts();
        return texts.map(t => parseFloat(t.replace(/[^\d.]/g, '')));
    }
}
