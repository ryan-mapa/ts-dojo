/**
 * Mobile check: the touch affordances only exist under a coarse pointer, so
 * none of them are exercised by the desktop smoke test.
 *
 * The key assertion is the ":e;xport" one. It proves in a single line that a
 * symbol key inserted at the caret AND that an arrow key stepped exactly one
 * character — which is the whole reason the bar exists, since Monaco draws its
 * own cursor and gives you none of the platform's touch aids.
 *
 * Needs `npm run dev` running, or SMOKE_URL set.
 */
import { chromium, devices } from 'playwright';
const b = await chromium.launch({ channel: 'chrome' });

// Chrome applies touch emulation asynchronously: the FIRST context in a fresh
// browser reports maxTouchPoints 0 and `pointer: fine`, and only later contexts
// are correct. Verified by probing three runs in a row. Burning one context
// makes this check deterministic instead of passing two times in three.
await (await b.newContext()).close();

const ctx = await b.newContext({ ...devices['iPhone 13'] });
const p = await ctx.newPage();
let bad = false;
const ok = (l, v) => { console.log(`  ${v ? 'PASS' : 'FAIL'}  ${l}`); if (!v) bad = true; };

const BASE = process.env.SMOKE_URL ?? 'http://localhost:5173/ts-dojo/';
await p.goto(BASE + '#/module/foundations/widening', { waitUntil: 'networkidle' });
await p.waitForSelector('.monaco-editor');
await p.waitForTimeout(900);

// Reported, not asserted. Which of these Chrome sets is a property of its
// emulator, not of this app — `pointer: coarse` in particular flips between
// runs. What matters is that isTouchLayout() reaches the right conclusion from
// whichever signals are present, and that is what the next line checks.
const signals = await p.evaluate(() => ({
  coarse: matchMedia('(pointer: coarse)').matches,
  maxTouchPoints: navigator.maxTouchPoints,
  ontouchstart: 'ontouchstart' in window,
}));
console.log(`  touch signals seen: ${JSON.stringify(signals)}`);
ok('touch layout was chosen (keybar rendered)', await p.locator('.keybar').isVisible());
// 6 cursor keys + tab + 9 symbols. Deliberately a fixed number: the set was
// trimmed so both rows fit without scrolling, and silently growing it again
// would reintroduce exactly the overflow this replaced.
ok('16 keys, the trimmed set', (await p.locator('.keybar button').count()) === 16);

// Focus the editor and normalise the cursor to the start of line 1.
await p.locator('.monaco-editor .view-line').first().tap();
await p.waitForTimeout(300);
await p.getByLabel('Start of line').tap();

// Insert A, step right one character, insert B  ->  "A" + "e" + "B" + "xport..."
await p.getByLabel('Insert :').tap();          // exercises the symbol keys
await p.getByLabel('Move cursor right').tap(); // exercises the arrow keys
await p.getByLabel('Insert |').tap();
await p.waitForTimeout(400);

const line1 = (await p.locator('.monaco-editor .view-line').first().innerText()).replace(/ /g, ' ');
console.log(`  line 1 is now: ${JSON.stringify(line1.slice(0, 16))}`);
ok('symbols inserted and arrow stepped exactly one char', line1.startsWith(':e|xport'));

ok('no horizontal overflow', await p.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));

// Two fixed rows, and neither may scroll — the whole point of trimming the key
// set was that every key stays visible.
const rows = await p.evaluate(() =>
  [...document.querySelectorAll('.keybar-row')].map((r) => ({
    keys: r.children.length,
    clipped: r.scrollWidth > r.clientWidth + 1,
    narrowest: Math.round(Math.min(...[...r.children].map((c) => c.getBoundingClientRect().width))),
  })));
console.log('  rows:', JSON.stringify(rows));
ok('exactly two rows', rows.length === 2);
ok('no row scrolls', rows.every((r) => !r.clipped));
ok('every key at least 30px wide', rows.every((r) => r.narrowest >= 30));
const h = await p.locator('.keybar button').first().boundingBox();
ok(`tap targets >= 40px tall (${Math.round(h.height)}px)`, h.height >= 40);
ok('hover cards disabled on touch', await p.evaluate(() => !document.querySelector('.monaco-hover')));

// iOS Safari zooms the page on focusing any input under 16px, which strands the
// layout. Monaco's focusable textareas are invisible, so this is unnoticeable in
// a screenshot and only shows up on a real device — worth pinning. Monaco has
// already renamed this element once (inputarea -> ime-text-area).
const inputSizes = await p.evaluate(() =>
  [...document.querySelectorAll('.monaco-editor textarea')].map((t) => ({
    cls: t.className,
    px: parseFloat(getComputedStyle(t).fontSize),
  })));
console.log('  focusable inputs:', JSON.stringify(inputSizes));
ok('no input under 16px (would trigger iOS zoom)', inputSizes.length > 0 && inputSizes.every((i) => i.px >= 16));

await p.screenshot({ path: process.env.SHOT });
await ctx.close(); await b.close();
console.log(bad ? '\nMOBILE CHECK FAILED' : '\nMOBILE CHECK PASSED');
process.exit(bad ? 1 : 0);
