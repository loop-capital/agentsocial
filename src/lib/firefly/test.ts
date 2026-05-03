#!/usr/bin/env node
/**
 * Quick test for Firefly API integration.
 * Requires: FIREFLY_CLIENT_ID, FIREFLY_CLIENT_SECRET env vars.
 * Usage: npx tsx src/lib/firefly/test.ts
 */

import { Firefly } from "./index.js";

async function main() {
  console.log("=== Firefly API Test ===\n");

  let firefly: Firefly;
  try {
    firefly = Firefly.fromEnv();
  } catch (e) {
    console.error("Missing env vars. Set FIREFLY_CLIENT_ID and FIREFLY_CLIENT_SECRET.");
    process.exit(1);
  }

  // Test 1: Auth
  console.log("[1/3] Testing authentication...");
  const connected = await firefly.testConnection();
  if (!connected) {
    console.error("  Auth failed. Check credentials.");
    process.exit(1);
  }
  console.log("  Auth OK\n");

  // Test 2: Generate
  console.log("[2/3] Testing image generation...");
  try {
    const result = await firefly.generate.generate({
      prompt: "a minimalist social media post about wellness, clean design, pastel colors",
      numVariations: 1,
      contentClass: "photo",
    });
    console.log(`  Job ID: ${result.jobId}`);
    console.log(`  Status: ${result.status}`);
  } catch (e) {
    console.error(`  Generate failed: ${(e as Error).message}`);
  }

  // Test 3: Upscale (if we have a test image)
  console.log("\n[3/3] Upscale test skipped (needs image).\n");

  console.log("=== Test Complete ===");
}

main().catch(console.error);
