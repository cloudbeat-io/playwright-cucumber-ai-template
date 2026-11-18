import { Locator, Page } from 'playwright';
import { CheckoutOverviewPage } from './CheckoutOverviewPage';

/**
 * "Checkout: Your Information" page (/checkout-step-one.html): form with First Name, Last Name and
 * Zip/Postal Code, plus "Cancel" and "Continue" buttons.
 */
export class CheckoutInformationPage {
    /** "First Name" text field, first in the form. */
    readonly firstNameInput: Locator;
    /** "Last Name" text field, second in the form. */
    readonly lastNameInput: Locator;
    /** "Zip/Postal Code" text field, third in the form. */
    readonly postalCodeInput: Locator;
    /** Green "Continue" button at the bottom right; goes to "Checkout: Overview" when all fields are filled. */
    readonly continueButton: Locator;
    /**
     * Red error banner above the buttons when a field is missing, e.g. "Error: First Name is required".
     * Only the first missing field is reported.
     */
    readonly errorMessage: Locator;

    constructor(private readonly page: Page) {
        this.firstNameInput = page.getByRole('textbox', { name: 'First Name' });
        this.lastNameInput = page.getByRole('textbox', { name: 'Last Name' });
        this.postalCodeInput = page.getByRole('textbox', { name: 'Zip/Postal Code' });
        this.continueButton = page.getByRole('button', { name: 'Continue' });
        this.errorMessage = page.locator('[data-test="error"]');
    }

    /** Fills the three fields; an empty string leaves that field empty. */
    async enterInformation(firstName: string, lastName: string, postalCode: string) {
        await this.firstNameInput.fill(firstName);
        await this.lastNameInput.fill(lastName);
        await this.postalCodeInput.fill(postalCode);
    }

    /** Clicks Continue. With all fields filled it navigates to "Checkout: Overview"; otherwise shows the error banner. */
    async continue(): Promise<CheckoutOverviewPage> {
        await this.continueButton.click();
        return new CheckoutOverviewPage(this.page);
    }

    /** Text of the error banner, e.g. "Error: Postal Code is required". */
    async getError(): Promise<string> {
        return this.errorMessage.innerText();
    }
}
