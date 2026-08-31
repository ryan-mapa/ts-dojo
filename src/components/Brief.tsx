import { Fragment, type ReactNode } from 'react';

/**
 * A deliberately tiny markdown renderer: paragraphs, `inline code` and
 * *emphasis*, nothing else. Briefs are authored in this repo, so there is no
 * untrusted input and no reason to pull in a markdown library (or to reach for
 * dangerouslySetInnerHTML).
 *
 * Code spans are matched first and never re-scanned, so a `*` inside backticks
 * stays literal.
 */
function renderInline(text: string): ReactNode[] {
  return text.split(/(`[^`]+`)/g).flatMap((part, i) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 1) {
      return <code key={i}>{part.slice(1, -1)}</code>;
    }
    return part.split(/(\*[^*]+\*)/g).map((chunk, j) =>
      chunk.startsWith('*') && chunk.endsWith('*') && chunk.length > 1 ? (
        <em key={`${i}-${j}`}>{chunk.slice(1, -1)}</em>
      ) : (
        <Fragment key={`${i}-${j}`}>{chunk}</Fragment>
      ),
    );
  });
}

export function Brief({ markdown }: { markdown: string }) {
  const paragraphs = markdown.split(/\n\s*\n/);
  return (
    <div className="brief">
      {paragraphs.map((p, i) => (
        <p key={i}>{renderInline(p.replace(/\n/g, ' '))}</p>
      ))}
    </div>
  );
}
