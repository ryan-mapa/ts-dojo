/**
 * Verifies the share button's fallback chain, which unit tests cannot reach:
 * `navigator.share` and `navigator.clipboard` are both conditionally present,
 * and the interesting behavior is what happens when one of them is missing or
 * rejects. Each case stubs a different combination and asserts the user still
 * ends up with the link.
 *
 * tests/links.test.ts covers the URL itself. This covers getting it to a human.
 *
 * Uses the locally installed Chrome; no browser download. Needs `npm run dev`.
 */
import { chromium } from 'playwright';
const BASE = 'http://localhost:5173/ts-dojo/';
const EXPECTED = 'https://ryan-mapa.github.io/ts-dojo/';

const browser = await chromium.launch({ channel: 'chrome' });
let failed = false;
const check = (l, ok, extra = '') => { console.log(`${ok ? '  PASS' : '  FAIL'}  ${l}${extra}`); if (!ok) failed = true; };

const openPage = async (init) => {
  const ctx = await browser.newContext();
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://localhost:5173' });
  const page = await ctx.newPage();
  if (init) await page.addInitScript(init);
  await page.goto(BASE);
  await page.waitForSelector('.share button');
  return { page, ctx };
};
const statusText = (page) => page.locator('.share-status').innerText();
const clip = (page) => page.evaluate(() => navigator.clipboard.readText());

try {
  // What a real desktop Chrome user actually gets, before any stubbing.
  {
    const { page, ctx } = await openPage();
    const has = await page.evaluate(() => ({ share: 'share' in navigator, clipboard: !!navigator.clipboard }));
    console.log(`  real Chrome: navigator.share=${has.share} clipboard=${has.clipboard}`);
    await ctx.close();
  }

  // 1. No share sheet -> clipboard.
  {
    const { page, ctx } = await openPage(() =>
      Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }));
    await page.evaluate(() => navigator.clipboard.writeText('sentinel'));
    await page.locator('.share button').click();
    await page.waitForFunction(() => document.querySelector('.share-status')?.textContent?.includes('copied'), null, { timeout: 5000 }).catch(() => {});
    check('clipboard path copies the canonical URL', (await clip(page)) === EXPECTED, ` — ${await clip(page)}`);
    check('clipboard path confirms in the UI', /copied/i.test(await statusText(page)));
    await page.waitForTimeout(2800);
    check('confirmation clears itself', (await statusText(page)).trim() === '');
    await ctx.close();
  }

  // 2. Share sheet present -> used, with the right payload, and no redundant copy.
  {
    const { page, ctx } = await openPage(() => {
      window.__shared = null;
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: (d) => { window.__shared = d; return Promise.resolve(); },
      });
    });
    await page.evaluate(() => navigator.clipboard.writeText('sentinel'));
    await page.locator('.share button').click();
    const shared = await page.evaluate(() => window.__shared);
    check('share sheet receives the canonical URL', shared?.url === EXPECTED, ` — ${JSON.stringify(shared)}`);
    check('share sheet path shows no extra confirmation', (await statusText(page)).trim() === '');
    check('share sheet path does not also touch the clipboard', (await clip(page)) === 'sentinel');
    await ctx.close();
  }

  // 3. Cancelling the sheet is a decision, not a failure: no copy, no message.
  {
    const { page, ctx } = await openPage(() =>
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: () => Promise.reject(new DOMException('cancelled', 'AbortError')),
      }));
    await page.evaluate(() => navigator.clipboard.writeText('sentinel'));
    await page.locator('.share button').click();
    await page.waitForTimeout(400);
    check('cancelling the sheet copies nothing', (await clip(page)) === 'sentinel');
    check('cancelling the sheet says nothing', (await statusText(page)).trim() === '');
    await ctx.close();
  }

  // 4. Sheet throws for a real reason -> falls through to clipboard.
  {
    const { page, ctx } = await openPage(() =>
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: () => Promise.reject(new DOMException('no target', 'NotAllowedError')),
      }));
    await page.evaluate(() => navigator.clipboard.writeText('sentinel'));
    await page.locator('.share button').click();
    await page.waitForFunction(() => document.querySelector('.share-status')?.textContent?.includes('copied'), null, { timeout: 5000 }).catch(() => {});
    check('a failing sheet falls back to copying', (await clip(page)) === EXPECTED);
    await ctx.close();
  }

  // 5. Neither API (an insecure-context phone on the LAN) -> execCommand, or the
  //    URL rendered for manual selection. Either is acceptable; silence is not.
  {
    const { page, ctx } = await openPage(() => {
      Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
      Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    });
    await page.locator('.share button').click();
    await page.waitForTimeout(500);
    const text = (await statusText(page)).trim();
    check('with no APIs at all the user still gets something', /copied/i.test(text) || text === EXPECTED, ` — "${text}"`);
    await ctx.close();
  }
} catch (e) {
  console.error(e);
  failed = true;
} finally {
  await browser.close();
}
console.log(failed ? 'SHARE CHECK FAILED' : 'SHARE CHECK PASSED');
process.exit(failed ? 1 : 0);
