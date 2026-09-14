'use strict';

const { chromium } = require('playwright');

const REALISTIC_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
];

const PLATFORMS = {
  instagram: {
    url: 'https://www.instagram.com/',
    loginUrl: 'https://www.instagram.com/accounts/login/',
  },
  facebook: {
    url: 'https://www.facebook.com/',
    loginUrl: 'https://www.facebook.com/login/',
  },
  tiktok: {
    url: 'https://www.tiktok.com/',
    loginUrl: 'https://www.tiktok.com/login/',
  },
};

/**
 * Generate a random human-like delay in milliseconds
 * @param {number} min - Minimum delay ms
 * @param {number} max - Maximum delay ms
 */
function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Pick a random item from an array
 */
function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Human-like mouse movement using bezier curves
 */
async function humanMouseMove(page, fromX, fromY, toX, toY) {
  const steps = randomDelay(8, 20);
  const controlPoints = [
    { x: fromX + randomDelay(-100, 100), y: fromY + randomDelay(-80, 80) },
    { x: toX + randomDelay(-50, 50), y: toY + randomDelay(-50, 50) },
  ];

  await page.mouse.move(fromX, fromY);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    // Quadratic bezier
    const x = Math.round(
      (1 - t) * (1 - t) * fromX +
      2 * (1 - t) * t * controlPoints[0].x +
      t * t * toX
    );
    const y = Math.round(
      (1 - t) * (1 - t) * fromY +
      2 * (1 - t) * t * controlPoints[0].y +
      t * t * toY
    );
    await page.mouse.move(x, y);
    await page.waitForTimeout(randomDelay(5, 20));
  }
}

/**
 * Human-like typing with realistic speeds and typos/corrections
 */
async function humanType(page, selector, text, options = {}) {
  const { clearFirst = true } = options;
  await page.click(selector);
  await page.waitForTimeout(randomDelay(100, 300));

  if (clearFirst) {
    await page.keyboard.down('Control');
    await page.keyboard.press('a');
    await page.keyboard.up('Control');
    await page.keyboard.press('Delete');
  }

  for (const char of text) {
    // Occasional realistic pause (word boundary pause)
    if (char === ' ' || char === '.' || char === '@') {
      await page.waitForTimeout(randomDelay(50, 150));
    }
    await page.keyboard.type(char, { delay: randomDelay(30, 120) });
    // Random longer pause 5% of the time
    if (Math.random() < 0.05) {
      await page.waitForTimeout(randomDelay(200, 500));
    }
  }
}

/**
 * Scroll like a human — small random scrolls with pauses
 */
async function humanScroll(page, amount = 300) {
  await page.mouse.wheel(0, randomDelay(amount - 100, amount + 100));
  await page.waitForTimeout(randomDelay(200, 600));
}

/**
 * Inject anti-detection scripts to hide automation signals
 */
function injectStealthScripts(context) {
  // Run in all pages
  context.on('page', (page) => {
    page.on('load', () => {
      page.evaluate(() => {
        // Remove webdriver property
        Object.defineProperty(navigator, 'webdriver', { get: () => false });

        // Mock plugins
        Object.defineProperty(navigator, 'plugins', {
          get: () => [
            { name: 'Chrome PDF Plugin' },
            { name: 'Chrome PDF Viewer' },
            { name: 'Native Client' },
          ],
        });

        // Mock languages
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
        });

        // Remove automation-related globals
        window.chrome = { runtime: {} };

        // Reset permissions
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) =>
          parameters.name === 'notifications'
            ? Promise.resolve({ state: Notification.permission })
            : originalQuery(parameters);
      });
    });
  });
}

/**
 * Build stealth browser context with random fingerprint
 */
async function createStealthBrowser(platform, options = {}) {
  const { headless = true, proxyUrl = null, userDataDir = null } = options;

  const userAgent = randomPick(REALISTIC_USER_AGENTS);
  const platformKey = PLATFORMS[platform] ? platform : 'instagram';

  const launchArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu',
    '--window-size=1280,800',
    '--disable-blink-features=AutomationControlled',
    '--exclude-switches=enable-automation',
    '--disable-infobars',
    '--disable-login-animations',
    '--disable-commit-pending-navigation-bindings',
    '--disable-domain-reliability',
    '--disable-renderer-backgrounding',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
  ];

  if (proxyUrl) {
    launchArgs.push(`--proxy-server=${proxyUrl}`);
  }

  const contextOptions = {
    headless,
    userAgent,
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
    args: launchArgs,
  };

  if (userDataDir) {
    contextOptions['userDataDir'] = userDataDir;
  }

  const browser = await chromium.launch(contextOptions);

  const context = browser.contexts()[0] || await browser.newContext(contextOptions);

  // Apply stealth injection
  injectStealthScripts(context);

  // Additional context-level stealth
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  return { browser, context, userAgent, platformUrl: PLATFORMS[platformKey].url };
}

/**
 * Save session cookies to a file for persistence
 */
async function saveSessionCookies(context, sessionPath) {
  const cookies = await context.cookies();
  const fs = require('fs');
  fs.writeFileSync(sessionPath, JSON.stringify(cookies, null, 2));
  return cookies;
}

/**
 * Load session cookies from a file
 */
async function loadSessionCookies(context, sessionPath) {
  const fs = require('fs');
  if (!fs.existsSync(sessionPath)) return false;
  const cookies = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
  await context.addCookies(cookies);
  return true;
}

/**
 * Take a screenshot (for debugging)
 */
async function screenshot(page, path) {
  await page.screenshot({ path, fullPage: false });
}

module.exports = {
  createStealthBrowser,
  humanType,
  humanMouseMove,
  humanScroll,
  randomDelay,
  saveSessionCookies,
  loadSessionCookies,
  screenshot,
  REALISTIC_USER_AGENTS,
  injectStealthScripts,
};
