import { chromium, Browser, Page } from 'playwright';

let browser: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch({
      headless: process.env.HEADED !== '1',
    });
  }
  return browser;
}

export async function getPage(
  url: string
): Promise<{
  page: Page;
  requestUrls: string[];
  close: () => Promise<void>;
}> {
  const b = await getBrowser();
  const context = await b.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  // Set up network interception to capture all requests
  const requestUrls: string[] = [];
  page.on('request', (request) => {
    requestUrls.push(request.url());
  });

  try {
    // Try networkidle first (more reliable)
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
  } catch {
    // Fallback to domcontentloaded if networkidle times out
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15_000 });
    } catch {
      // If even domcontentloaded fails, proceed with what we have
      // Page might be partially loaded
    }
  }

  return {
    page,
    requestUrls,
    close: () => context.close(),
  };
}

export async function closeBrowser() {
  await browser?.close();
  browser = null;
}
