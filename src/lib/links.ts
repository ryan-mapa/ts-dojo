/**
 * The canonical public URL, deliberately hardcoded rather than derived from
 * `location`. A share link is only useful to the person receiving it, and
 * `location.origin` is `localhost:5173` in dev and a deep link into whatever
 * exercise you happened to be on — neither is the thing you meant to send.
 *
 * Kept honest by tests/links.test.ts, which checks it against vite's `base`.
 */
export const APP_URL = 'https://ryan-mapa.github.io/ts-dojo/';

export const REPO_URL = 'https://github.com/ryan-mapa/ts-dojo';

/** What the share sheet shows above the link on platforms that render it. */
export const SHARE_TITLE = 'ts-dojo';
export const SHARE_TEXT = 'Learn TypeScript by arguing with the compiler.';
