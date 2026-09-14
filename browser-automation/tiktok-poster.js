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

async function tiktokLogin(context, username, password) {
  const page = await context.newPage();
  await loadCookies(context, username, 'tiktok');
  await page.goto('https://www.tiktok.com/login', { waitUntil: 'networkidle', timeout: 30000 });

  const url = page.url();
  if (!url.includes('login') || url === 'about:blank') {
    await page.close();
    return true;
  }

  await sleep(randDelay(1500, 2500));

  // Try email/username tab
  const emailTab = page.locator('*').filter({ hasText: /email|username/i }).first();
  if (await emailTab.isVisible().catch(() => false)) {
    await emailTab.click();
    await sleep(randDelay(800, 1500));
  }

  // Fill credentials
  const inputs = await page.locator('input[type="text"], input[placeholder*="email" i], input[placeholder*="phone" i]').all();
  for (const input of inputs) {
    if (await input.isVisible().catch(() => false)) {
      await input.fill(username);
      await sleep(randDelay(200, 500));
      break;
    }
  }

  const passInputs = await page.locator('input[type="password"]').all();
  for (const passInput of passInputs) {
    if (await passInput.isVisible().catch(() => false)) {
      await passInput.fill(password);
      await sleep(randDelay(200, 500));
      break;
    }
  }

  const submitBtn = page.locator('button[type="submit"]').first();
  if (await submitBtn.isVisible().catch(() => false)) {
    await submitBtn.click();
  }
  await sleep(randDelay(3000, 6000));

  if (page.url().includes('login') && !page.url().includes('auth')) {
    await page.screenshot({ path: `/tmp/tiktok_login_err_${Date.now()}.png` });
    await page.close();
    throw new Error('TikTok login failed — check credentials');
  }

  await saveCookies(context, username, 'tiktok');
  await page.close();
  return true;
}

/**
 * Post a video to TikTok via browser.
 * TikTok only accepts video — no image posting.
 * @param {object} creds
 * @param {string} creds.username
 * @param {string} creds.password
 * @param {string} creds.videoPath - Absolute path to MP4 (REQUIRED)
 * @param {string} [creds.caption] - Video caption
 * @param {string} [creds.hashtags] - Space-separated hashtags
 */
async function postToTikTok(creds) {
  const { username, password, videoPath, caption = '', hashtags = '' } = creds;
  if (!videoPath) throw new Error('videoPath is REQUIRED for TikTok — TikTok only supports video content');

  const fullCaption = caption + (hashtags ? ` ${hashtags}` : '');

  const { browser, context } = await createStealthBrowser();
  let page;
  try {
    await tiktokLogin(context, username, password);
    page = await context.newPage();

    await page.goto('https://www.tiktok.com/upload', { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(randDelay(2000, 4000));

    // Upload video
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(videoPath);

    // Wait for upload (TikTok processes video server-side)
    // Poll for upload completion — progress bar disappears when done
    let uploaded = false;
    for (let i = 0; i < 40; i++) { // up to 2 min
      await sleep(3000);
      const progress = page.locator('[class*="progress"]').first();
      const progVisible = await progress.isVisible().catch(() => false);
      if (!progVisible) { uploaded = true; break; }
    }
    if (!uploaded) {
      // Fallback: just wait a long time
      await sleep(randDelay(15000, 25000));
    }

    // Fill caption
    const captionEl = page.locator('[contenteditable="true"]').first();
    if (await captionEl.isVisible().catch(() => false)) {
      await captionEl.click();
      await sleep(randDelay(200, 400));
      await captionEl.type(fullCaption, { delay: 60 });
    } else {
      const textarea = page.locator('textarea').first();
      if (await textarea.isVisible().catch(() => false)) {
        await textarea.fill(fullCaption);
      }
    }
    await sleep(randDelay(1000, 2000));

    // Post button
    const postBtn = page.locator('button').filter({ hasText: /post|publish/i }).first();
    if (await postBtn.isVisible().catch(() => false)) {
      await postBtn.click();
    }
    await sleep(randDelay(5000, 10000));

    const url = page.url();
    const success = !url.includes('/upload') && !url.includes('error');
    await page.close();
    return { success, platform: 'tiktok', postUrl: url };
  } catch (err) {
    if (page) await page.close().catch(() => {});
    throw err;
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  const creds = getCreds();
  postToTikTok(creds)
    .then(r => { console.log(JSON.stringify(r)); process.exit(r.success ? 0 : 1); })
    .catch(e => { console.error(e.message); console.log(JSON.stringify({ success: false, platform: 'tiktok', error: e.message })); process.exit(1); });
}

module.exports = { postToTikTok };
