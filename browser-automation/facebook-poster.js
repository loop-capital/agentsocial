'use strict';

// Shared credentials decoder
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

const { chromium } = require('playwright');

function randDelay(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randPick(a) { return a[Math.floor(Math.random() * a.length)]; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const REALISTIC_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
];

async function createStealthBrowser() {
  const ua = randPick(REALISTIC_USER_AGENTS);
  const args = [
    '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas', '--no-first-run', '--no-zygote',
    '--disable-gpu', '--window-size=1280,800',
    '--disable-blink-features=AutomationControlled',
    '--exclude-switches=enable-automation', '--disable-infobars',
  ];
  const browser = await chromium.launch({ headless: true, args, userAgent: ua });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, userAgent: ua });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });
  return { browser, context };
}

const SESSION_DIR = `${__dirname}/sessions`;

async function saveCookies(context, username, platform) {
  const fs = require('fs');
  if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });
  const p = `${SESSION_DIR}/${platform}_${username.replace(/[^a-z0-9]/gi,'_')}.json`;
  fs.writeFileSync(p, JSON.stringify(await context.cookies()));
}

async function loadCookies(context, username, platform) {
  const fs = require('fs');
  const p = `${SESSION_DIR}/${platform}_${username.replace(/[^a-z0-9]/gi,'_')}.json`;
  if (!fs.existsSync(p)) return false;
  await context.addCookies(JSON.parse(fs.readFileSync(p, 'utf8')));
  return true;
}

async function humanType(page, selector, text) {
  const el = page.locator(selector).first();
  await el.click();
  await sleep(randDelay(100, 300));
  await page.keyboard.down('Control');
  await page.keyboard.press('a');
  await page.keyboard.up('Control');
  await page.keyboard.press('Delete');
  for (const ch of text) {
    if (' .@'.includes(ch)) await sleep(randDelay(40, 120));
    await page.keyboard.type(ch, { delay: randDelay(30, 100) });
  }
}

async function facebookLogin(context, username, password) {
  const page = await context.newPage();
  await loadCookies(context, username, 'facebook');
  await page.goto('https://www.facebook.com/', { waitUntil: 'networkidle', timeout: 30000 });
  if (!page.url().includes('login')) { await page.close(); return true; }

  await page.goto('https://www.facebook.com/login/', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(randDelay(1000, 2000));
  await humanType(page, '#email', username);
  await sleep(randDelay(300, 700));
  await humanType(page, '#pass', password, { clearFirst: false });
  await sleep(randDelay(200, 500));
  await page.locator('button[name="login"]').click();
  await sleep(randDelay(4000, 8000));
  if (page.url().includes('login')) {
    await page.screenshot({ path: `/tmp/fb_login_err_${Date.now()}.png` });
    await page.close();
    throw new Error('Facebook login failed — check credentials');
  }
  await saveCookies(context, username, 'facebook');
  await page.close();
  return true;
}

async function postToFacebook(creds) {
  const { username, password, text, link, pageId } = creds;
  if (!text && !link) throw new Error('text or link is required for Facebook posting');

  const { browser, context } = await createStealthBrowser();
  let page;
  try {
    await facebookLogin(context, username, password);
    page = await context.newPage();
    const targetUrl = pageId ? `https://www.facebook.com/${pageId}` : 'https://www.facebook.com/';
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(randDelay(1500, 3000));

    // Click "Create Post" — try multiple selectors
    let composer = page.locator('[aria-label*="Create"]').first();
    if (!(await composer.isVisible().catch(() => false))) {
      composer = page.locator('[data-pagelet*="FeedUnit"] [role="presentation"]').first();
    }
    if (!(await composer.isVisible().catch(() => false))) {
      composer = page.locator('[aria-label*="Write something"]').first();
    }
    await composer.click().catch(() => {});
    await sleep(randDelay(800, 1500));

    // Type post text
    const editable = page.locator('[contenteditable="true"][aria-label*="something"]').first();
    if (await editable.isVisible().catch(() => false)) {
      await editable.click();
      await editable.type(text || '', { delay: 50 });
    } else {
      const textArea = page.locator('textarea[aria-label*="Write"]').first();
      if (await textArea.isVisible().catch(() => false)) {
        await humanType(page, 'textarea[aria-label*="Write"]', text || '');
      }
    }

    // Paste link if provided
    if (link) {
      await page.keyboard.type(` ${link}`, { delay: 80 });
      await sleep(randDelay(2000, 4000));
      // Accept link preview
      const acceptBtn = page.locator('button').filter({ hasText: /attach|add/i }).first();
      if (await acceptBtn.isVisible().catch(() => false)) await acceptBtn.click().catch(() => {});
      await sleep(randDelay(500, 1000));
    }

    // Post
    const postBtn = page.locator('[aria-label*="Post"], [data-testid*="post"]').first();
    if (await postBtn.isVisible().catch(() => false)) {
      await postBtn.click();
    }
    await sleep(randDelay(2000, 4000));

    const success = !page.url().includes('login');
    await page.close();
    return { success, platform: 'facebook', postUrl: page.url() };
  } catch (err) {
    if (page) await page.close().catch(() => {});
    throw err;
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  const creds = getCreds();
  postToFacebook(creds)
    .then(r => { console.log(JSON.stringify(r)); process.exit(r.success ? 0 : 1); })
    .catch(e => { console.error(e.message); console.log(JSON.stringify({ success: false, platform: 'facebook', error: e.message })); process.exit(1); });
}

module.exports = { postToFacebook };
