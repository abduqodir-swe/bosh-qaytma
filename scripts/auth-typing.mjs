// Verify that typing in the auth form doesn't trigger any flicker.
// We type into the phone input and screenshot mid-typing.
import { chromium } from "playwright";

const URL = "http://127.0.0.1:5174/auth";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 414, height: 896 } });
const page = await ctx.newPage();

await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(800);

// Find the phone input (the first input on the page)
const phoneInput = page.locator('input[type="tel"]').first();
await phoneInput.click();
await phoneInput.fill(""); // clear

// Type 1 char
await page.keyboard.type("9", { delay: 50 });
await page.waitForTimeout(100);
await page.screenshot({ path: "/tmp/bq-screens/07-auth-typing-1char.png" });

// Type 5 more
await page.keyboard.type("01234", { delay: 50 });
await page.waitForTimeout(100);
await page.screenshot({ path: "/tmp/bq-screens/08-auth-typing-6chars.png" });

// Type 10 more
await page.keyboard.type("567890", { delay: 50 });
await page.waitForTimeout(100);
await page.screenshot({ path: "/tmp/bq-screens/09-auth-typing-12chars.png" });

console.log("done — typed +998901234567890");

// Try a paste-like burst
await phoneInput.fill("+998901112233");
await page.waitForTimeout(200);
await page.screenshot({ path: "/tmp/bq-screens/10-auth-paste.png" });

await browser.close();
