// Inspect computed styles of the form-card during typing.
import { chromium } from "playwright";

const URL = "http://127.0.0.1:5174/auth";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 414, height: 896 } });
const page = await ctx.newPage();

await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

const phoneInput = page.locator('input[type="tel"]').first();
await phoneInput.click();

for (const n of [1, 2, 5, 10]) {
  for (let i = 0; i < n; i++) {
    await page.keyboard.type(String(i + 1).slice(-1), { delay: 30 });
  }
  await page.waitForTimeout(300);

  // Inspect all motion-like wrappers
  const info = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll("[style*='opacity'], [style*='transform']").forEach((el) => {
      const cs = window.getComputedStyle(el);
      if (cs.opacity !== "1" || cs.transform !== "none") {
        out.push({
          tag: el.tagName,
          cls: el.className?.toString().slice(0, 60),
          opacity: cs.opacity,
          transform: cs.transform,
          transition: cs.transition,
          animation: cs.animation,
        });
      }
    });
    return out;
  });
  console.log(`after ${n} chars, ${info.length} non-1/non-none elements:`);
  info.slice(0, 8).forEach((e) => console.log("  ", e));
}

await browser.close();
