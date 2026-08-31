/**
 * End-to-end check of the one thing unit tests cannot reach: that Monaco's
 * TypeScript worker actually boots in a browser and returns diagnostics.
 *
 * tests/content.test.ts already type-checks every exercise in Node. What it
 * cannot prove is that the *browser* agrees — the Monaco worker resolves script
 * kind from the file extension through a different path than our Node compiler
 * host, so `.tsx` and `.d.ts` exercises are verified here specifically.
 *
 * Uses the locally installed Chrome; no browser download.
 */
import { chromium } from 'playwright';

const BASE = process.env.SMOKE_URL ?? 'http://localhost:5173/ts-dojo/';

// One per exercise file type, since that's the axis where the browser and Node
// can diverge.
const CASES = [
  { module: 'foundations', exercise: 'annotate-a-function', kind: '.ts' },
  { module: 'declaration-files', exercise: 'declare-a-module', kind: '.d.ts' },
  { module: 'react', exercise: 'props-interface', kind: '.tsx' },
];

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();

const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('requestfailed', (r) => errors.push(`requestfailed ${r.url()}`));
page.on('response', (r) => r.status() >= 400 && errors.push(`HTTP ${r.status()} ${r.url()}`));

let failed = false;
const check = (label, ok) => {
  console.log(`${ok ? '  PASS' : '  FAIL'}  ${label}`);
  if (!ok) failed = true;
};

try {
  for (const c of CASES) {
    console.log(`\n${c.module}/${c.exercise}  (${c.kind})`);
    await page.goto(`${BASE}#/module/${c.module}/${c.exercise}`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.monaco-editor');

    // The starter is wrong by construction, so a working worker must reject it.
    await page.getByRole('button', { name: 'Check my answer' }).click();
    await page.waitForSelector('.verdict.fail, .verdict.pass', { timeout: 30_000 });
    check('starter is rejected', await page.locator('.verdict.fail').isVisible());

    // Drive the app's own reveal path rather than typing: Monaco auto-closes
    // brackets and quotes, so synthetic keystrokes produce mangled source.
    for (let i = 0; i < 5; i++) {
      const hint = page.getByRole('button', { name: /Stuck\?|Show hint/ });
      if (!(await hint.count())) break;
      await hint.click();
    }
    await page.getByRole('button', { name: 'Show the solution' }).click();
    await page.getByRole('button', { name: 'Check my answer' }).click();

    const passed = await page
      .waitForSelector('.verdict.pass', { timeout: 30_000 })
      .then(() => true)
      .catch(() => false);
    check('solution is accepted', passed);
    if (!passed) {
      const shown = await page.locator('.diags li').allTextContents();
      shown.slice(0, 4).forEach((d) => console.log(`        ${d.replace(/\s+/g, ' ').slice(0, 160)}`));
    }
    check('marks the exercise solved', await page.locator('.badge').isVisible());
  }

  console.log('\nprogress');
  await page.reload({ waitUntil: 'networkidle' });
  check('survives a reload', await page.locator('.badge').isVisible());

  if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT, fullPage: true });
} catch (err) {
  // Without this, any thrown error (a selector that never appears, a navigation
  // timeout) would skip straight to `finally` and report SMOKE PASSED, because
  // `failed` was never set. A smoke test that passes when it crashed is worse
  // than no smoke test.
  console.log(`\n  threw: ${err instanceof Error ? err.message.split('\n')[0] : String(err)}`);
  failed = true;
} finally {
  const real = errors.filter((e) => !/favicon|ResizeObserver/i.test(e));
  if (real.length) {
    console.log('\n  console errors:');
    real.slice(0, 5).forEach((e) => console.log(`    ${e.slice(0, 200)}`));
    failed = true;
  }
  await browser.close();
  console.log(failed ? '\nSMOKE FAILED' : '\nSMOKE PASSED');
  process.exit(failed ? 1 : 0);
}
