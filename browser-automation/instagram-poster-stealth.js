'use strict';

// Shared credentials decoder — credentials arrive via env var from backend connector
let _creds = null;
function getCreds() {
  if (_creds) return _creds;
  const raw = process.env.BROWSER_AUTOMATION_CREDS;
  if (!raw) throw new Error('BROWSER_AUTOMATION_CREDS environment variable not set');
  const p = JSON.parse(raw);
  const k = 'agentsocial-browser-creds-2024';
  function decrypt(enc) {
    const t = Buffer.from(enc, 'base64').toString('binary');
    let r = '';
    for (let i = 0; i < t.length; i++) r += String.fromCharCode(t.charCodeAt(i) ^ k.charCodeAt(i % k.length));
    return r;
  }
  _creds = {
    username: decrypt(p.username),
    password: decrypt(p.password),
    imagePath: p.imagePath || null,
    videoPath: p.videoPath || null,
    text: p.text || null,
    caption: p.caption || null,
    hashtags: p.hashtags || null,
    link: p.link || null,
    pageId: p.pageId || null,
  };
  return _creds;
}

// ─── Stealth Browser ────────────────────────────────────────────────────────────
const { chromium } = require('playwright');

const REALISTIC_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
];

function randDelay(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randPick(a) { return a[Math.floor(Math.random() * a.length)]; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function humanType(page, selector, text) {
  await page.click(selector);
  await sleep(randDelay(100, 300));
  await page.keyboard.down('Control');
  await page.keyboard.press('a');
  await page.keyboard.up('Control');
  await page.keyboard.press('Delete');
  for (const ch of text) {
    if (' .@'.includes(ch)) await sleep(randDelay(50, 150));
    await page.keyboard.type(ch, { delay: randDelay(30, 120) });
    if (Math.random() < 0.05) await sleep(randDelay(200, 500));
  }
}

async function humanScroll(page, amount = 300) {
  await page.mouse.wheel(0, amount + randDelay(-100, 100));
  await sleep(randDelay(200, 600));
}

async function humanMouseMove(page, fromX, fromY, toX, toY) {
  const steps = randDelay(8, 20);
  await page.mouse.move(fromX, fromY);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const mx = Math.round((1-t)*(1-t)*fromX + 2*(1-t)*t*(fromX + randDelay(-100,100)) + t*t*toX);
    const my = Math.round((1-t)*(1-t)*fromY + 2*(1-t)*t*(fromY + randDelay(-80,80)) + t*t*toY);
    await page.mouse.move(mx, my);
    await sleep(randDelay(5, 20));
  }
}

async function createStealthBrowser() {
  const ua = randPick(REALISTIC_USER_AGENTS);
  const args = [
    '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas', '--no-first-run', '--no-zygote',
    '--disable-gpu', '--window-size=1280,800',
    '--disable-blink-features=AutomationControlled',
    '--exclude-switches=enable-automation',
    '--disable-infobars', '--disable-login-animations',
  ];

  const browser = await chromium.launch({ headless: true, args, userAgent: ua });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, userAgent: ua });

  // Inject stealth
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  context.on('page', page => {
    page.on('load', () => page.evaluate(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      Object.defineProperty(navigator, 'plugins', { get: () => [{},{},{}] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US','en'] });
      window.chrome = { runtime: {} };
    }));
  });

  return { browser, context };
}

const SESSION_DIR = `${__dirname}/sessions`;

async function saveCookies(context, name, platform) {
  const fs = require('fs');
  const dir = SESSION_DIR;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const path2 = `${dir}/${platform}_${name.replace(/[^a-z0-9]/gi,'_')}.json`;
  fs.writeFileSync(path2, JSON.stringify(await context.cookies()));
  return path2;
}

async function loadCookies(context, username, platform) {
  const fs = require('fs');
  const dir = SESSION_DIR;
  const path2 = `${dir}/${platform}_${username.replace(/[^a-z0-9]/gi,'_')}.json`;
  if (!fs.existsSync(path2)) return false;
  await context.addCookies(JSON.parse(fs.readFileSync(path2, 'utf8')));
  return true;
}

// ─── Instagram ─────────────────────────────────────────────────────────────────

async function instagramLogin(context, username, password) {
  const page = await context.newPage();
  await loadCookies(context, username, 'instagram');
  await page.goto('https://www.instagram.com/', { waitUntil: 'networkidle', timeout: 30000 });
  const url = page.url();
  if (!url.includes('login')) { await page.close(); return true; }

  await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(randDelay(1000, 2000));

  await humanType(page, 'input[name="username"]', username);
  await sleep(randDelay(300, 700));
  await humanType(page, 'input[name="password"]', password, { clearFirst: false });
  await sleep(randDelay(200, 500));

  await page.locator('button[type="submit"]').first().click();
  await sleep(randDelay(4000, 8000));

  if (page.url().includes('login')) throw new Error('Instagram login failed — bad credentials');
  await saveCookies(context, username, 'instagram');
  await page.close();
  return true;
}

async function postToInstagram(creds) {
  const { username, password, imagePath, caption, hashtags = '' } = creds;
  if (!imagePath) throw new Error('imagePath is required for Instagram posting');
  const fullCaption = (caption || '') + (hashtags ? '\n\n' + hashtags : '');

  const { browser, context } = await createStealthBrowser();
  let page;
  try {
    await instagramLogin(context, username, password);
    page = await context.newPage();
    await page.goto('https://www.instagram.com/', { waitUntil: 'networkidle', timeout: 30000 });

    // Click new post button
    const newPost = page.locator('svg[aria-label="New post"]').first();
    if (await newPost.isVisible().catch(() => false)) {
      await newPost.click();
      await sleep(randDelay(1500, 3000));
    }

    // Upload image
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(imagePath);
    await sleep(randDelay(2000, 4000));

    // Next button(s)
    const next1 = page.locator('button').filter({ hasText: 'Next' }).first();
    if (await next1.isVisible().catch(() => false)) { await next1.click(); await sleep(randDelay(1000, 2000)); }
    const next2 = page.locator('button').filter({ hasText: 'Next' }).first();
    if (await next2.isVisible().catch(() => false)) { await next2.click(); await sleep(randDelay(1000, 2000)); }

    // Caption
    const captionEl = page.locator('textarea[aria-label*="aption"], div[aria-label*="aption"]').first();
    if (await captionEl.isVisible().catch(() => false)) {
      await captionEl.click();
      await captionEl.type(fullCaption, { delay: 60 });
    }
    await sleep(randDelay(500, 1000));

    // Share
    const shareBtn = page.locator('button').filter({ hasText: 'Share' }).first();
    if (await shareBtn.isVisible().catch(() => false)) {
      await shareBtn.click();
      await sleep(randDelay(3000, 6000));
    }

    const url = page.url();
    const success = !url.includes('/upload') && !url.includes('error');
    await page.close();
    return { success, platform: 'instagram', postUrl: page.url() };
  } catch (err) {
    if (page) await page.close().catch(() => {});
    throw err;
  } finally {
    await browser.close();
  }
}

// ─── CLI Entry ────────────────────────────────────────────────────────────────
if (require.main === module) {
  const creds = getCreds();
  postToInstagram(creds)
    .then(r => { console.log(JSON.stringify(r)); process.exit(r.success ? 0 : 1); })
    .catch(e => { console.error(e.message); console.log(JSON.stringify({ success: false, platform: 'instagram', error: e.message })); process.exit(1); });
}

module.exports = { postToInstagram };
