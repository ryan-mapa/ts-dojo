import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { APP_URL, REPO_URL } from '../src/lib/links';

/**
 * APP_URL is hardcoded on purpose (see src/lib/links.ts), which means nothing
 * stops it from drifting away from where the site is actually published. These
 * tests re-derive it from the two files that decide that — the repo slug and
 * vite's base path — so a rename breaks CI instead of shipping a dead link.
 */
describe('the shared link', () => {
  const owner = 'ryan-mapa';
  const repo = 'ts-dojo';

  it('matches the repo it is served from', () => {
    expect(REPO_URL).toBe(`https://github.com/${owner}/${repo}`);
    expect(APP_URL).toBe(`https://${owner}.github.io/${repo}/`);
  });

  it("agrees with vite's base path", () => {
    const base = /base:\s*'([^']+)'/.exec(readFileSync('vite.config.ts', 'utf8'))?.[1];
    expect(base).toBe(`/${repo}/`);
    expect(new URL(APP_URL).pathname).toBe(base);
  });

  it('ends in a slash so no redirect hop is needed', () => {
    expect(APP_URL.endsWith('/')).toBe(true);
  });
});
