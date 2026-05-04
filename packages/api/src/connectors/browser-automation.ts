// Browser Automation Connectors — Post via Playwright (no OAuth/business verification)
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

// Path to the browser automation scripts
const BROWSER_AUTOMATION_DIR = "/home/jason/.openclaw/workspaces/agentsocial/browser-automation";

export interface BrowserCredentials {
  username: string;
  password: string;
}

export interface BrowserPublishOptions {
  credentials: BrowserCredentials;
  imagePath?: string;
  videoPath?: string;
  caption: string;
}

export interface BrowserPublishResult {
  success: boolean;
  platformPostId?: string;
  platformPostUrl?: string;
  error?: string;
}

// Generic runner for browser automation scripts
async function runBrowserScript(
  scriptName: string,
  args: Record<string, string>
): Promise<BrowserPublishResult> {
  const scriptPath = path.join(BROWSER_AUTOMATION_DIR, scriptName);
  const argString = Object.entries(args)
    .map(([key, value]) => `--${key}="${value.replace(/"/g, '\\"')}"`)
    .join(" ");

  try {
    const { stdout, stderr } = await execAsync(
      `node ${scriptPath} ${argString}`,
      { timeout: 120000, cwd: BROWSER_AUTOMATION_DIR }
    );

    if (stderr && !stderr.includes("Navigation")) {
      console.warn(`Browser script stderr: ${stderr}`);
    }

    // Parse result from stdout
    const result = JSON.parse(stdout.trim());
    return {
      success: result.success ?? true,
      platformPostId: result.postId,
      platformPostUrl: result.postUrl,
      error: result.error,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Browser automation failed",
    };
  }
}

// Instagram via browser automation
export async function publishToInstagramBrowser(
  options: BrowserPublishOptions
): Promise<BrowserPublishResult> {
  if (!options.imagePath) {
    return { success: false, error: "Instagram requires an image" };
  }

  return runBrowserScript("instagram-poster-stealth.js", {
    username: options.credentials.username,
    password: options.credentials.password,
    imagePath: options.imagePath,
    caption: options.caption,
  });
}

// Facebook via browser automation
export async function publishToFacebookBrowser(
  options: BrowserPublishOptions
): Promise<BrowserPublishResult> {
  if (!options.imagePath) {
    return { success: false, error: "Facebook requires an image" };
  }

  return runBrowserScript("facebook-poster.js", {
    username: options.credentials.username,
    password: options.credentials.password,
    imagePath: options.imagePath,
    caption: options.caption,
  });
}

// TikTok via browser automation
export async function publishToTikTokBrowser(
  options: BrowserPublishOptions
): Promise<BrowserPublishResult> {
  if (!options.videoPath) {
    return { success: false, error: "TikTok requires a video" };
  }

  return runBrowserScript("tiktok-poster.js", {
    username: options.credentials.username,
    password: options.credentials.password,
    videoPath: options.videoPath,
    caption: options.caption,
  });
}

// Unified dispatch — picks browser automation or API based on channel config
export async function publishViaBrowser(
  platform: "instagram" | "facebook" | "tiktok",
  options: BrowserPublishOptions
): Promise<BrowserPublishResult> {
  switch (platform) {
    case "instagram":
      return publishToInstagramBrowser(options);
    case "facebook":
      return publishToFacebookBrowser(options);
    case "tiktok":
      return publishToTikTokBrowser(options);
    default:
      return { success: false, error: `Unsupported platform: ${platform}` };
  }
}
