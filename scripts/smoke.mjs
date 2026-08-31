/**
 * End-to-end check of the one thing unit tests cannot reach: that Monaco's
 * TypeScript worker actually boots in a browser and returns diagnostics.
 *
 * Everything else is verified in Node by tests/content.test.ts. This exists
 * because the worker plumbing (specifier paths, MonacoEnvironment, the
 * `monaco.typescript` namespace move in 0.56) is exactly the kind of thing that
 * type-checks fine and then silently does nothing at runtime.
 *
 * Uses the locally installed Chrome; no browser download.
 */
import { chromium } from 'playwright';

const URL = process.env.SMOKE_URL ?? 'http://localhost:5173/ts-dojo/';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();

const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('requestfailed', (r) => errors.push(`requestfailed ${r.url()}`));
page.on('response', (r) => r.status() >= 400 && errors.push(`HTTP ${r.status()} ${r.url()}`));

const step = (msg) => console.log(`  ${msg}`);
let failed = false;
const check = (label, ok) => {
  console.log(`${ok ? '  PASS' : '  FAIL'}  ${label}`);
  if (!ok) failed = true;
};

try {
  await page.goto(URL, { waitUntil: 'networkidle' });

  step('module picker');
  await page.getByRole('link', { name: 'Foundations & Inference' }).click();
  await page.waitForSelector('.monaco-editor');
  check('editor mounts', await page.locator('.monaco-editor').isVisible());

  // The starter code is wrong by construction, so a working worker must report errors.
  step('grading wrong code');
  await page.getByRole('button', { name: 'Check my answer' }).click();
  await page.waitForSelector('.verdict.fail, .verdict.pass', { timeout: 30_000 });
  const diagCount = await page.locator('.diags li').count();
  check('starter code is rejected', await page.locator('.verdict.fail').isVisible());
  check(`real diagnostics rendered (${diagCount})`, diagCount > 0);

  // Drive the app's own reveal path rather than typing: Monaco auto-closes
  // brackets and quotes, so synthetic keystrokes produce mangled source.
  step('revealing the solution');
  for (let i = 0; i < 4; i++) {
    const hint = page.getByRole('button', { name: /Stuck\?|Show hint/ });
    if (!(await hint.count())) break;
    await hint.click();
  }
  await page.getByRole('button', { name: 'Show the solution' }).click();

  step('grading the solution');
  await page.getByRole('button', { name: 'Check my answer' }).click();
  await page.waitForSelector('.verdict.pass', { timeout: 30_000 });
  check('solution is accepted', await page.locator('.verdict.pass').isVisible());
  check('marks the exercise solved', await page.locator('.badge').isVisible());

  step('progress survives a reload');
  await page.reload({ waitUntil: 'networkidle' });
  check('still solved after reload', await page.locator('.badge').isVisible());

  await page.screenshot({ path: process.env.SHOT ?? 'smoke.png', fullPage: true });
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
