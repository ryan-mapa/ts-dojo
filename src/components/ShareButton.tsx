import { useEffect, useRef, useState } from 'react';
import { APP_URL, SHARE_TEXT, SHARE_TITLE } from '../lib/links';

type Status = 'idle' | 'copied' | 'failed';

/**
 * Three tiers, because the two modern APIs are both conditionally present:
 *
 *  1. `navigator.share` — the native sheet. Phones have it; so do recent
 *     desktop Chrome and Safari. Cancelling it throws `AbortError`, which is a
 *     user decision, not an error, so it must not fall through to a copy.
 *  2. `navigator.clipboard` — only exists in a secure context, so it is absent
 *     over plain http on a LAN address, which is exactly how you'd open this on
 *     a phone to test it.
 *  3. A selected-textarea `execCommand('copy')`. Deprecated, still universally
 *     implemented, and the only thing left when 1 and 2 are gone.
 */
async function shareLink(): Promise<Status> {
  if (navigator.share) {
    try {
      await navigator.share({ title: SHARE_TITLE, text: SHARE_TEXT, url: APP_URL });
      return 'idle'; // The sheet already gave its own confirmation.
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return 'idle';
      // Anything else (NotAllowedError, no share target) falls through to copy.
    }
  }

  try {
    await navigator.clipboard.writeText(APP_URL);
    return 'copied';
  } catch {
    return legacyCopy(APP_URL) ? 'copied' : 'failed';
  }
}

function legacyCopy(text: string): boolean {
  const field = document.createElement('textarea');
  field.value = text;
  // Off-screen rather than `display: none` — an unrendered field cannot be
  // selected, and an unselected one cannot be copied.
  field.setAttribute('readonly', '');
  field.style.cssText = 'position:fixed;top:-9999px;opacity:0';
  document.body.appendChild(field);
  try {
    field.select();
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    field.remove();
  }
}

export function ShareButton() {
  const [status, setStatus] = useState<Status>('idle');
  const timer = useRef<number>(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onClick = async () => {
    const next = await shareLink();
    setStatus(next);
    window.clearTimeout(timer.current);
    if (next !== 'idle') timer.current = window.setTimeout(() => setStatus('idle'), 2400);
  };

  return (
    <span className="share">
      <button type="button" className="link" onClick={onClick}>
        Share ts-dojo
      </button>
      {/* Polite, not assertive: confirming a copy should not interrupt whatever
          a screen reader is already saying. */}
      <span className="share-status" role="status" aria-live="polite">
        {status === 'copied' && 'Link copied'}
        {status === 'failed' && APP_URL}
      </span>
    </span>
  );
}
