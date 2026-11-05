import { chromium } from 'playwright';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';

const SCREENSHOT_DIR = path.resolve('tests/screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: 'desktop_1920', width: 1920, height: 1080 },
  { name: 'laptop_1366', width: 1366, height: 768 },
  { name: 'tablet_768', width: 768, height: 1024 },
  { name: 'mobile_390', width: 390, height: 844 },
];

async function waitForServer(url: string, timeoutMs: number = 30000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status === 200 || res.status === 304 || res.status === 307) {
        return true;
      }
    } catch {
      // wait
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function runAudit() {
  console.log('--- STARTING PLAYWRIGHT VIEWPORT & UI AUDIT ---');

  // Start Next.js production server
  const webDir = path.resolve('apps/web');
  const nextServer: ChildProcess = spawn('cmd.exe', ['/c', 'npx', 'next', 'start', '-p', '3000'], {
    cwd: webDir,
    stdio: 'pipe',
  });

  nextServer.stdout?.on('data', (d) => process.stdout.write(`[next] ${d}`));
  nextServer.stderr?.on('data', (d) => process.stderr.write(`[next-err] ${d}`));

  console.log('Waiting for Next.js web dashboard on http://localhost:3000 ...');
  const ready = await waitForServer('http://localhost:3000');
  if (!ready) {
    nextServer.kill();
    throw new Error('Next.js server failed to respond within 30s');
  }
  console.log('Next.js web dashboard is UP and ready!');

  const browser = await chromium.launch({ headless: true });

  const auditResults: Array<{ viewport: string; path: string; hasOverflow: boolean }> = [];

  for (const vp of VIEWPORTS) {
    console.log(`\nAuditing viewport: ${vp.name} (${vp.width}x${vp.height})...`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    // 1. Visit main dashboard
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    // Check for horizontal overflow (critical for responsive design)
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    const screenshotPath = path.join(SCREENSHOT_DIR, `${vp.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`Saved screenshot: ${screenshotPath} | Horizontal Overflow: ${hasHorizontalOverflow}`);

    auditResults.push({
      viewport: `${vp.width}x${vp.height} (${vp.name})`,
      path: screenshotPath,
      hasOverflow: hasHorizontalOverflow,
    });

    // 2. Also capture login page
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    const loginScreenshotPath = path.join(SCREENSHOT_DIR, `login_${vp.name}.png`);
    await page.screenshot({ path: loginScreenshotPath, fullPage: false });

    await context.close();
  }

  await browser.close();

  // Terminate next server
  console.log('\nShutting down Next.js test server...');
  nextServer.kill();

  console.log('\n================ AUDIT SUMMARY ================');
  for (const r of auditResults) {
    console.log(`Viewport: ${r.viewport} | Overflow: ${r.hasOverflow ? 'FAIL' : 'PASS'} | File: ${r.path}`);
  }
  console.log('================================================');
}

runAudit().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});

