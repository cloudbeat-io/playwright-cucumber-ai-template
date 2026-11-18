import { Locator, Page } from 'playwright';
import { HeaderComponent } from './components/HeaderComponent';
import { InventoryPage } from './InventoryPage';

/**
 * "Checkout: Complete!" page (/checkout-complete.html): pony illustration, "Thank you for your order!"
 * heading, a dispatch message, and a "Back Home" button.
 */
export class CheckoutCompletePage {
    readonly header: HeaderComponent;
    /** "Thank you for your order!" heading in the middle of the page. */
    readonly confirmationHeader: Locator;
    /** "Back Home" button under the message; returns to the Products page. */
    readonly backHomeButton: Locator;

    constructor(private readonly page: Page) {
        this.header = new HeaderComponent(page);
        this.confirmationHeader = page.locator('[data-test="complete-header"]');
        this.backHomeButton = page.getByRole('button', { name: 'Back Home' });
    }

    /** Clicks "Back Home"; navigates to the Products page. */
    async backHome(): Promise<InventoryPage> {
        await this.backHomeButton.click();
        return new InventoryPage(this.page);
    }
}
