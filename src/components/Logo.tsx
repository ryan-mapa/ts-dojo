/**
 * Wordmark, built from real text rather than an SVG of outlined glyphs: it stays
 * crisp at any size, inherits the page's font stack, and remains selectable and
 * readable to a screen reader.
 *
 * The `ts` tile deliberately reads like the language chip you see on a file in
 * an editor — the thing a developer's eye already parses as "this is TypeScript"
 * — with `dojo` completing the name beside it, so neither half is redundant.
 */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? 'logo compact' : 'logo'}>
      <span className="logo-tile">ts</span>
      <span className="logo-word">dojo</span>
    </span>
  );
}
