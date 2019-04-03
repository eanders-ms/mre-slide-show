import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import puppeteer from 'puppeteer';
import UUID from 'uuid/v4';

const slidesUri = 'https://slides.com/seldo/npm-future-of-javascript#/';

export default class App {
    // The Chromium browser in headless mode.
    private browser: puppeteer.Browser;
    // The browser page to host the slides.
    private page: puppeteer.Page;
    // A timer to generate new screenshots of the current slide.
    private timer: NodeJS.Timer;
    // The plane in-world where we show the slides.
    private surface: MRE.Actor;
    // Cached previous screenshot. If it equals the current screenshot then no new material will be generated.
    private prevScreenshot: Buffer;

    constructor(private context: MRE.Context, private server: MRE.WebHost) {
        this.context.onStarted(() => this.started());
        this.context.onStopped(() => this.stopped());
    }

    private async started() {
        try {
            // Create the browser.
            this.browser = await puppeteer.launch();
            // Create a new page in the browser.
            this.page = await this.browser.newPage();
            // Create the plane in-world where we'll display the web page.
            this.surface = await MRE.Actor.CreatePrimitive(this.context, {
                addCollider: true,
                definition: {
                    shape: MRE.PrimitiveShape.Plane,
                    dimensions: { x: 5, y: 5, z: 5 }
                },
                actor: {
                    transform: {
                        rotation: MRE.Quaternion.FromEulerAngles(-90 * MRE.DegreesToRadians, 0, 0)
                    }
                }
            });
            // Make the plane clickable. When clicked on, advance to the next slide.
            const buttonBehavior = this.surface.setBehavior(MRE.ButtonBehavior);
            buttonBehavior.onClick('released', () => this.nextSlide());
            // Open the web page to the slides.
            await this.page.goto(slidesUri);
            // Render the first screenshot.
            await this.renderSlide();
            // Start rendering at 30 screenshots per second.
            this.timer = setInterval(() => this.renderSlide(), 1000 / 30);
        } catch (e) {
            console.log(e);
        }
    }

    private async stopped() {
        // Stop rendering slides.
        try { clearInterval(this.timer); } catch { }
        // Close the browser.
        try { await this.page.close(); } catch { }
        try { await this.browser.close(); } catch { }
        this.timer = null;
        this.page = null;
        this.browser = null;
    }

    private async nextSlide() {
        try {
            // Find the 'next' button in the dom.
            const elements = await this.page.$x('//*[@id="main"]/div[1]/div[1]/div/div/aside/button[2]/div');
            if (elements && elements.length) {
                // Click on it.
                await elements[0].click();
            }
        } catch (e) {
            console.log(e);
        }
    }

    private async renderSlide() {
        try {
            // Take a screenshot of the current page.
            const screenshot = await this.page.screenshot({ encoding: 'binary', type: 'png' });
            // If this screenshot is the same as the previous screenshot, return early.
            if (this.prevScreenshot && this.prevScreenshot.equals(screenshot)) return;
            this.prevScreenshot = screenshot;
            // Save the screenshot as a buffer addressable by URI.
            const filename = `${UUID()}.png`;
            const uri = this.server.registerStaticBuffer(filename, screenshot);
            // Generate a new texture material and assign it to the in-world plane.
            const AM = this.context.assetManager;
            const texture = await AM.createTexture('slide', { uri });
            const material = await AM.createMaterial('slide', { mainTextureId: texture.id });
            this.surface.appearance.materialId = material.id;
        } catch (e) {
            console.log(e);
        }
    }
}
