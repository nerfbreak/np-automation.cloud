import { chromium } from 'playwright';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const browser = await chromium.launch({ headless: true, args: ["--window-size=1920,1080"] });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  console.log("Navigating...");
  await page.goto(process.env.NEWSPAGE_URL || "");
  
  console.log("Logging in...");
  await page.fill("#txtUserid", process.env.NEWSPAGE_USER_ID || "");
  await page.fill("#txtPasswd", process.env.NEWSPAGE_PASSWORD || "");
  await page.click("#btnLogin");
  
  try {
    await page.waitForSelector("#SYS_ASCX_btnContinue", { timeout: 5000 });
    console.log("Found active session popup, bypassing...");
    await page.click("#SYS_ASCX_btnContinue");
  } catch {
    console.log("No active session popup.");
  }
  
  console.log("Waiting 5s for dashboard...");
  await page.waitForTimeout(5000);
  
  console.log("Frames:");
  for (const f of page.frames()) {
    console.log(" - " + f.name() + " | " + f.url());
  }
  
  const hasSetup = await page.evaluate(() => {
    return !!document.querySelector("[id$='_SysAdminSetup']");
  });
  console.log("Has _SysAdminSetup in main context?", hasSetup);
  
  for (const f of page.frames()) {
    const found = await f.evaluate(() => !!document.querySelector("[id$='_SysAdminSetup']")).catch(() => false);
    if (found) console.log("Found in frame:", f.name());
  }
  
  await page.screenshot({ path: 'test-dashboard.png' });
  await browser.close();
}
run().catch(console.error);
