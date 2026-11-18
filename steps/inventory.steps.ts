import { DataTable, Given, Then, When } from '@cucumber/cucumber';
import { expect } from 'playwright/test';
import { CbWorld } from '../support/world';
import { InventoryPage } from '../pages/InventoryPage';
import { HeaderComponent } from '../pages/components/HeaderComponent';
import { FooterComponent } from '../pages/components/FooterComponent';

Given('I add {string} to the cart', async function (this: CbWorld, product: string) {
    const inventory = new InventoryPage(this.page);
    await inventory.addToCart(product);
    await expect(inventory.removeButton(product)).toBeVisible();
});

When('I remove {string} from the cart', async function (this: CbWorld, product: string) {
    await new InventoryPage(this.page).removeFromCart(product);
});

When('I sort products by {string}', async function (this: CbWorld, option: string) {
    await new InventoryPage(this.page).sortBy(option);
});

Then('the catalog shows {int} products', async function (this: CbWorld, count: number) {
    await expect(new InventoryPage(this.page).productCards).toHaveCount(count);
});

Then('the first product is {string}', async function (this: CbWorld, name: string) {
    await expect(new InventoryPage(this.page).productNames.first()).toHaveText(name);
});

Then('the product prices are in ascending order', async function (this: CbWorld) {
    const prices = await new InventoryPage(this.page).getProductPrices();
    expect(prices.length).toBeGreaterThan(1);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
});

Then('the cart badge shows {int}', async function (this: CbWorld, count: number) {
    await expect(new HeaderComponent(this.page).cartBadge).toHaveText(String(count));
});

Then('the cart is empty', async function (this: CbWorld) {
    const header = new HeaderComponent(this.page);
    await expect(header.cartButton).toHaveAccessibleName('Cart, empty');
    await expect(header.cartBadge).toBeHidden();
});

Then('the selected sort option is {string}', async function (this: CbWorld, option: string) {
    await expect(new InventoryPage(this.page).activeSortOption).toHaveText(option);
});

Then('the catalog lists these products:', async function (this: CbWorld, table: DataTable) {
    const inventory = new InventoryPage(this.page);
    const rows = table.hashes();
    await expect(inventory.productNames).toHaveText(rows.map(r => r.name));
    await expect(inventory.productPrices).toHaveText(rows.map(r => r.price));
});

Then('every product shows an image, a description and an "Add to cart" button', async function (this: CbWorld) {
    const inventory = new InventoryPage(this.page);
    const names = await inventory.getProductNames();
    expect(names.length).toBeGreaterThan(0);
    await expect(inventory.productDescriptions).toHaveCount(names.length);
    for (const name of names) {
        await expect(inventory.productImage(name)).toBeVisible();
        await expect(inventory.productDescription(name)).not.toBeEmpty();
        await expect(inventory.addToCartButton(name)).toBeEnabled();
    }
});

Then('the footer shows the social links {string}', async function (this: CbWorld, links: string) {
    const footer = new FooterComponent(this.page);
    for (const name of links.split(',').map(l => l.trim())) {
        await expect(footer.socialLink(name)).toBeVisible();
    }
    await expect(footer.copyright).toContainText('Sauce Labs. All Rights Reserved.');
});
