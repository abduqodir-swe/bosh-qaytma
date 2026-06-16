// Take screenshots of key pages on mobile + desktop viewports.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const URL = "http://127.0.0.1:5174";
const OUT = "/tmp/bq-screens";
mkdirSync(OUT, { recursive: true });

const routes = [
  { path: "/",          name: "01-home" },
  { path: "/auth",      name: "02-auth" },
  { path: "/loads",     name: "03-loads" },
  { path: "/post-load", name: "04-post-load" },
  { path: "/profile",   name: "05-profile" },
  { path: "/chats",     name: "06-chats" },
];

const viewports = [
  { name: "mobile",  width: 414,  height: 896 },
  { name: "desktop", width: 1440, height: 900 },
];

const browser = await chromium.launch();

for (const v of viewports) {
  const ctx = await browser.newContext({ viewport: { width: v.width, height: v.height } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log(`[${v.name}] PAGEERR:`, e.message));
  page.on("console", (m) => { if (m.type() === "error") console.log(`[${v.name}] CONSOLE:`, m.text()); });

  for (const r of routes) {
    try {
      await page.goto(`${URL}${r.path}`, { waitUntil: "networkidle", timeout: 15000 });
      await page.waitForTimeout(800);
      const file = `${OUT}/${r.name}-${v.name}.png`;
      await page.screenshot({ path: file, fullPage: false });
      console.log(`[${v.name}] ${r.path} -> ${file}`);
    } catch (e) {
      console.log(`[${v.name}] ${r.path} FAILED:`, e.message);
    }
  }
  await ctx.close();
}

await browser.close();
console.log("done");
