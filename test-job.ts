import { chromium } from 'playwright';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const browser = await chromium.launch({ headless: true, args: ["--window-size=1920,1080"] });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  console.log("Navigating...");
  await page.goto(process.env.NEWSPAGE_URL || "");
  await page.fill("#txtUserid", process.env.NEWSPAGE_USER_ID || "");
  await page.fill("#txtPasswd", process.env.NEWSPAGE_PASSWORD || "");
  await page.click("#btnLogin");
  
  try {
    await page.waitForSelector("#SYS_ASCX_btnContinue", { timeout: 5000 });
    console.log("Bypassing...");
    await page.click("#SYS_ASCX_btnContinue");
  } catch {}
  
  await page.waitForTimeout(5000);
  
  console.log("Opening Job Menu...");
  for (const frame of page.frames()) {
    const el = await frame.$("[id$='_SysAdminSetup']");
    if (el) await el.click();
  }
  await page.waitForTimeout(2000);
  
  for (const frame of page.frames()) {
    const el = await frame.$("[id$='_itm_Job']");
    if (el) await el.click();
  }
  await page.waitForTimeout(5000);

  // Click Add
  for (const frame of page.frames()) {
    const el = await frame.$("#pag_FW_SYS_INTF_JOB_btn_Add_Value");
    if (el) await el.click();
  }
  await page.waitForTimeout(3000);
  
  // Interface ID SelectButton
  for (const frame of page.frames()) {
    const el = await frame.$("#pag_FW_SYS_INTF_JOB_DTL_PopupNew_INTF_ID_SelectButton");
    if (el) await el.click();
  }
  await page.waitForTimeout(5000);
  
  // Dump all inputs in the popup
  for (const frame of page.frames()) {
    const inputs = await frame.evaluate(() => {
      return Array.from(document.querySelectorAll("input")).map(e => e.id);
    });
    const filters = inputs.filter(i => i.includes("Filter"));
    if (filters.length > 0) console.log("Inputs in a frame:", filters);
  }
  
  // Fill filter and search
  for (const frame of page.frames()) {
    await frame.evaluate(() => {
      const els = Array.from(document.querySelectorAll("input[id$='_FilterField_Value']"));
      const el = els[els.length - 1];
      if (el) {
         (el as HTMLInputElement).value = "E_20150315090000028";
      }
    });
  }
  
  for (const frame of page.frames()) {
    await frame.evaluate(() => {
      const els = Array.from(document.querySelectorAll("[id$='SearchForm_ButtonSearch_Value']"));
      const el = els[els.length - 1];
      if (el) {
         (el as HTMLElement).click();
      }
    });
  }
  
  console.log("Waiting for grid reload...");
  await page.waitForTimeout(4000);
  
  // Dump grid rows
  for (const frame of page.frames()) {
    const gridContent = await frame.evaluate(() => {
      const els = Array.from(document.querySelectorAll("tr"));
      return els.filter(tr => tr.innerText.includes("E_20150315090000028")).map(tr => tr.innerHTML);
    });
    if (gridContent.length > 0) console.log("Grid matched rows:", gridContent);
  }
  
  await browser.close();
}
run().catch(console.error);
