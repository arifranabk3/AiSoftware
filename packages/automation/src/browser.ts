import { chromium, Browser, BrowserContext, Page } from 'playwright';

export interface AutomationRunOptions {
  headless?: boolean;
  timeoutMs?: number;
}

export class SafeBrowserAutomation {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;

  public async launch(options: AutomationRunOptions = {}): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: options.headless ?? true
      });
    }
    return this.browser;
  }

  public async createPage(): Promise<Page> {
    if (!this.browser) {
      await this.launch();
    }
    if (!this.context) {
      this.context = await this.browser!.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) EnterpriseAICommandCenter/1.0'
      });
    }
    return this.context.newPage();
  }

  public async close(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  public assertSafetyPolicy(targetUrl: string): void {
    const parsed = new URL(targetUrl);
    // Explicit Zero-Cost and ethical boundary guard:
    // Block payment gateways or restricted financial routes
    const blockedKeywords = ['checkout.stripe.com', 'paypal.com/signin', 'billing', 'subscribe'];
    for (const word of blockedKeywords) {
      if (parsed.hostname.includes(word) || parsed.pathname.includes(word)) {
        throw new Error(
          `SAFETY POLICY BLOCKED: Automation cannot access payment or financial URL: ${targetUrl}`
        );
      }
    }
  }
}

export const safeBrowser = new SafeBrowserAutomation();
