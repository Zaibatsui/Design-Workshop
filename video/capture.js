/**
 * Capture each shot HTML at 1920×1080 to /app/video/frames/shot-NN.png.
 * Uses headless Chromium directly (playwright npm pkg) so we get crisp
 * full-resolution PNGs that ffmpeg can stitch losslessly.
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = process.env.BASE_URL || "https://content-forge-1039.preview.emergentagent.com";
const OUT = path.resolve(__dirname, "frames");

(async () => {
  const browser = await chromium.launch({ executablePath: "/pw-browsers/chromium_headless_shell-1208/chrome-linux/headless_shell" });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  for (let i = 1; i <= 10; i++) {
    const id = String(i).padStart(2, "0");
    const url = `${BASE}/_dws_video/shot-${id}.html`;
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    // Give web fonts a beat to settle so the Inter/JetBrains Mono swap
    // doesn't get captured mid-transition.
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(450);
    const file = path.join(OUT, `shot-${id}.png`);
    await page.screenshot({ path: file, type: "png", clip: { x: 0, y: 0, width: 1920, height: 1080 } });
    console.log("Captured", file);
  }
  await browser.close();
})();
