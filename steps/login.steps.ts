import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from 'playwright/test';
import { CbWorld } from '../support/world';
import { appPassword } from '../support/config';
import { LoginPage } from '../pages/LoginPage';
import { HeaderComponent } from '../pages/components/HeaderComponent';

Given('the user opens the Swag Labs login page', async function (this: CbWorld) {
    await new LoginPage(this.page).open();
});

Given('I am logged in as {string}', async function (this: CbWorld, username: string) {
    const loginPage = new LoginPage(this.page);
    await loginPage.open();
    const inventory = await loginPage.login(username, appPassword);
    await expect(inventory.header.title).toHaveText('Products');
});

When('I log in as {string} with password {string}', async function (this: CbWorld, username: string, password: string) {
    await new LoginPage(this.page).login(username, password);
});

When('I log out', async function (this: CbWorld) {
    await new HeaderComponent(this.page).logout();
});

Then('the login form is shown', async function (this: CbWorld) {
    const loginPage = new LoginPage(this.page);
    await expect(loginPage.loginButton).toBeVisible();
    await expect(loginPage.usernameInput).toBeEmpty();
});

Then('the login error {string} is shown', async function (this: CbWorld, message: string) {
    await expect(new LoginPage(this.page).errorMessage).toHaveText(message);
});

Then('the page title is {string}', async function (this: CbWorld, title: string) {
    await expect(new HeaderComponent(this.page).title).toHaveText(title);
});
