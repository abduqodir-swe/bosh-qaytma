import { chromium } from "playwright";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 414, height: 896 } });
const page = await ctx.newPage();
await page.goto("http://127.0.0.1:5174/auth", { waitUntil: "networkidle" });
await page.waitForTimeout(2000); // wait for any initial animations
const phoneInput = page.locator('input[type="tel"]').first();
await phoneInput.click();
await page.keyboard.type("9", { delay: 50 });

// Now check ALL elements with opacity/transitions
const all = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll("*").forEach((el) => {
    const cs = window.getComputedStyle(el);
    if (cs.opacity !== "1" || cs.transitionDuration !== "0s" || cs.animationName !== "none") {
      out.push({
        tag: el.tagName,
        cls: (el.className?.toString() || "").slice(0, 80),
        opacity: cs.opacity,
        transition: cs.transition,
        animation: cs.animation,
      });
    }
  });
  return out;
});
console.log(`Found ${all.length} animated elements:`);
all.slice(0, 30).forEach((e) => console.log(JSON.stringify(e, null, 0)));
await browser.close();
