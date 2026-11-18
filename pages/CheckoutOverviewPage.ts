import { Locator, Page } from 'playwright';
import { CheckoutCompletePage } from './CheckoutCompletePage';

/**
 * "Checkout: Overview" page (/checkout-step-two.html): items being ordered, payment and shipping info,
 * and the "Price Total" block (item total, tax, total), with "Cancel" and "Finish" buttons.
 */
export class CheckoutOverviewPage {
    /** Names of the items being ordered. */
    readonly itemNames: Locator;
    /** "Item total: $29.99" line in the Price Total block (sum of item prices, before tax). */
    readonly itemTotal: Locator;
    /** "Tax: $2.40" line in the Price Total block. */
    readonly tax: Locator;
    /** "Total: $32.39" line in the Price Total block (item total + tax). */
    readonly total: Locator;
    /** Green "Finish" button at the bottom right; places the order. */
    readonly finishButton: Locator;

    constructor(private readonly page: Page) {
        this.itemNames = page.locator('[data-test="inventory-item-name"]');
        this.itemTotal = page.locator('[data-test="subtotal-label"]');
        this.tax = page.locator('[data-test="tax-label"]');
        this.total = page.locator('[data-test="total-label"]');
        this.finishButton = page.getByRole('button', { name: 'Finish' });
    }

    /** Clicks Finish; navigates to "Checkout: Complete!" and empties the cart. */
    async finish(): Promise<CheckoutCompletePage> {
        await this.finishButton.click();
        return new CheckoutCompletePage(this.page);
    }

    /** Item total before tax as a number ("Item total: $29.99" → 29.99). */
    async getItemTotal(): Promise<number> {
        return toAmount(await this.itemTotal.innerText());
    }

    /** Tax as a number ("Tax: $2.40" → 2.4). */
    async getTax(): Promise<number> {
        return toAmount(await this.tax.innerText());
    }

    /** Order total as a number ("Total: $32.39" → 32.39). */
    async getTotal(): Promise<number> {
        return toAmount(await this.total.innerText());
    }
}

/** "Item total: $1,029.99" → 1029.99 */
function toAmount(text: string): number {
    return parseFloat(text.replace(/[^\d.]/g, ''));
}
