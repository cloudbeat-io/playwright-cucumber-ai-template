import {
    setWorldConstructor,
    World,
    IWorldOptions,
    Before,
    After,
    AfterStep,
    Status,
    setDefaultTimeout
} from '@cucumber/cucumber';
import { Browser, BrowserContext, Page, chromium } from 'playwright';
import { cb, wrapPlaywrightPage } from '@cloudbeat/cucumber';
import * as fs from 'fs';
import * as path from 'path';

setDefaultTimeout(30 * 1000);

const tracesDir = 'reports/traces';
const videosDir = 'reports/videos';

export interface CbWorld extends World {
    browser: Browser;
    context: BrowserContext;
    page: Page;
    secondPage?: Page;
    testName: string;
    startTime: Date;
    /** Values a step stores for a later step in the same scenario (e.g. a price read before an action). */
    remembered: Record<string, unknown>;
}

export class PlaywrightWorld extends World implements CbWorld {
    browser!: Browser;
    context!: BrowserContext;
    page!: Page;
    secondPage?: Page;
    testName!: string;
    startTime!: Date;
    remembered: Record<string, unknown> = {};

    constructor(options: IWorldOptions) {
        super(options);
    }
}

setWorldConstructor(PlaywrightWorld);

Before(async function (this: CbWorld, { pickle }) {
    cb.setWorld(this);
    this.startTime = new Date();
    this.testName = pickle.name.replace(/\W/g, '-');

    // PW_TEST_CONNECT_WS_ENDPOINT+CB_AGENT is set by CloudBeat when running in a containerized environment
    // where browsers are provided by a remote Playwright server.
    // Therefore we connect to the remote server when the variables are present, and fall back to a
    // local launch for regular usage.
    this.browser = process.env.PW_TEST_CONNECT_WS_ENDPOINT && process.env.CB_AGENT
        ? await chromium.connect(process.env.PW_TEST_CONNECT_WS_ENDPOINT)
        : await chromium.launch({
            // Headed by default so you can watch; HEADLESS=1 for CI or background runs.
            headless: Boolean(process.env.HEADLESS),
            // SLOWMO=<ms> adds a delay before each browser action, for debugging. Off by default.
            slowMo: Number(process.env.SLOWMO) || 0,
        });
    this.context = await this.browser.newContext({
        recordVideo: process.env.CB_AGENT ? { dir: videosDir } : undefined,
    });

    if (process.env.CB_AGENT) {
        await this.context.tracing.start({ screenshots: true, snapshots: true });

        const rawPage = await this.context.newPage();
        this.page = wrapPlaywrightPage(rawPage, this) as Page;
    }
    else {
        this.page = await this.context.newPage();
    }
});

AfterStep(async function (this: CbWorld, { result }) {
    if (process.env.CB_AGENT && result && result.status !== Status.PASSED) {
        try {
            const image = await this.page?.screenshot();
            if (image) {
                this.attach(image, 'image/png');
            } else {
                console.error('Failed to take page screenshot for failed step');
            }
        } catch (e: any) {
            console.error('Failed to take page screenshot for failed step: ' + e.message);
        }
    }
});

After(async function (this: CbWorld, { result }) {
    // Capture every page opened in the context (e.g. additional tabs) before it's closed,
    // since recordVideo produces one video per page, not just for this.page
    const pages = this.context?.pages() ?? [];

    if (process.env.CB_AGENT && result && result.status !== Status.PASSED) {
        try {
            const timePart = this.startTime?.toISOString().split('.')[0].replaceAll(':', '_');
            const tracePath = path.resolve(tracesDir, `${this.testName}-${timePart}-trace.zip`);
            fs.mkdirSync(tracesDir, { recursive: true });
            await this.context?.tracing.stop({ path: tracePath });
            cb.addAttachment('trace', tracePath);
        } catch (e: any) {
            console.error('Failed to stop tracing: ' + e.message);
        }
    } else {
        try {
            await this.context?.tracing.stop();
        } catch (e: any) {
            console.error('Failed to stop tracing: ' + e.message);
        }
    }

    // KEEP_OPEN=1 leaves the browser window on screen after a failing scenario, for debugging.
    // The test process stays alive until the window is closed manually (or Ctrl+C).
    const keepOpen = Boolean(process.env.KEEP_OPEN) && result?.status !== Status.PASSED;

    if (!keepOpen) {
        await this.page?.close();
        await this.context?.close();
    }

    // Attach videos - this should be done after the page/context is closed so each video is properly finalized
    if (process.env.CB_AGENT && result && result.status !== Status.PASSED) {
        for (const [index, page] of pages.entries()) {
            const video = page.video();
            if (!video) {
                continue;
            }
            try {
                const suffix = pages.length > 1 ? `-tab${index + 1}` : '';
                const videoPath = path.resolve(videosDir, `${this.testName}${suffix}.webm`);
                fs.mkdirSync(videosDir, { recursive: true });
                await video.saveAs(videoPath);
                cb.addAttachment('video', videoPath);
            } catch (e: any) {
                console.error(`Failed to retreive video for tab ${index + 1}: ` + e.message);
            }
        }
    }

    if (!keepOpen) {
        await this.browser?.close();
    }
});
