import { Locator, Page } from 'playwright';

/** Swag Labs footer at the bottom of every page after login: social media links and the copyright line. */
export class FooterComponent {
    /** The whole footer area. */
    readonly footer: Locator;
    /** Copyright line, e.g. "© 2026 Sauce Labs. All Rights Reserved. Terms of Service | Privacy Policy". */
    readonly copyright: Locator;

    constructor(private readonly page: Page) {
        this.footer = page.getByRole('contentinfo');
        this.copyright = page.locator('[data-test="footer-copy"]');
    }

    /** Social media link in the footer by its visible name: "X", "Facebook" or "LinkedIn". Opens a new tab. */
    socialLink(name: string): Locator {
        return this.footer.getByRole('link', { name, exact: true });
    }
}
