import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from 'playwright/test';
import { CbWorld } from '../support/world';
import { CartPage } from '../pages/CartPage';
import { CheckoutCompletePage } from '../pages/CheckoutCompletePage';
import { CheckoutInformationPage } from '../pages/CheckoutInformationPage';
import { CheckoutOverviewPage } from '../pages/CheckoutOverviewPage';
import { HeaderComponent } from '../pages/components/HeaderComponent';

Given('I open the cart', async function (this: CbWorld) {
    await new HeaderComponent(this.page).openCart();
    await expect(new HeaderComponent(this.page).title).toHaveText('Your Cart');
});

Then('the cart contains {string}', async function (this: CbWorld, product: string) {
    await expect(new CartPage(this.page).itemNames).toContainText([product]);
});

When(
    'I check out with first name {string}, last name {string} and postal code {string}',
    async function (this: CbWorld, firstName: string, lastName: string, postalCode: string) {
        const information = await new CartPage(this.page).checkout();
        await information.enterInformation(firstName, lastName, postalCode);
        await information.continue();
    },
);

Then('the checkout error {string} is shown', async function (this: CbWorld, message: string) {
    await expect(new CheckoutInformationPage(this.page).errorMessage).toHaveText(message);
});

Then('the item total is {float}', async function (this: CbWorld, amount: number) {
    const overview = new CheckoutOverviewPage(this.page);
    await expect(overview.itemTotal).toBeVisible();
    expect(await overview.getItemTotal()).toBeCloseTo(amount, 2);
});

Then('the order total equals the item total plus tax', async function (this: CbWorld) {
    const overview = new CheckoutOverviewPage(this.page);
    await expect(overview.total).toBeVisible();
    const [itemTotal, tax, total] = await Promise.all([overview.getItemTotal(), overview.getTax(), overview.getTotal()]);
    expect(tax).toBeGreaterThan(0);
    expect(total).toBeCloseTo(itemTotal + tax, 2);
});

When('I finish the order', async function (this: CbWorld) {
    await new CheckoutOverviewPage(this.page).finish();
});

Then('the order confirmation {string} is shown', async function (this: CbWorld, message: string) {
    await expect(new CheckoutCompletePage(this.page).confirmationHeader).toHaveText(message);
});
