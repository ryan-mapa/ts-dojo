import { Fragment, useEffect, useState, type ReactNode } from 'react';
import * as monaco from 'monaco-editor';

/**
 * A deliberately tiny markdown renderer: paragraphs, `inline code`, *emphasis*
 * and fenced code blocks. Content is authored in this repo, so there is no
 * untrusted input and no reason to pull in a markdown library.
 *
 * Fence tags carry meaning, and the content tests enforce it:
 *   ```ts       this example must compile clean
 *   ```ts-bad   this example must NOT compile (it is illustrating an error)
 *   ```         not type-checked
 */
function renderInline(text: string): ReactNode[] {
  // One scanner rather than nested splits. Splitting on code spans first and
  // then on emphasis cannot handle **`bold code`**, because the two halves of
  // the bold marker end up in different chunks and can never pair up.
  //
  // Order in the alternation matters: `**` must be tried before `*`.
  const token = /`([^`]+)`|\*\*([\s\S]+?)\*\*|\*([^*]+)\*/g;
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;

  while ((m = token.exec(text)) !== null) {
    if (m.index > last) out.push(<Fragment key={key++}>{text.slice(last, m.index)}</Fragment>);
    if (m[1] !== undefined) {
      out.push(<code key={key++}>{m[1]}</code>);
    } else if (m[2] !== undefined) {
      // Recurse: bold can contain code spans and emphasis. Each inner string is
      // strictly shorter than the outer, so this always terminates.
      out.push(<strong key={key++}>{renderInline(m[2])}</strong>);
    } else if (m[3] !== undefined) {
      out.push(<em key={key++}>{renderInline(m[3])}</em>);
    }
    last = token.lastIndex;
  }
  if (last < text.length) out.push(<Fragment key={key++}>{text.slice(last)}</Fragment>);
  return out;
}

/** The same inline formatting, for one-line text like module blurbs. */
export function Inline({ text }: { text: string }) {
  return <>{renderInline(text)}</>;
}

/**
 * Syntax-highlighted via Monaco's own colorizer rather than a second
 * highlighting library — it is already in the bundle and produces exactly the
 * same colours as the editor beside it, so examples and your own code look
 * like one surface. The HTML it returns is generated from our own authored
 * content, never from user input.
 */
function CodeBlock({ code, bad }: { code: string; bad: boolean }) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    monaco.editor
      .colorize(code, 'typescript', { tabSize: 2 })
      .then((result) => live && setHtml(result))
      .catch(() => live && setHtml(null));
    return () => {
      live = false;
    };
  }, [code]);

  return (
    <pre className={bad ? 'example bad' : 'example'}>
      {bad && <span className="example-tag">does not compile</span>}
      {html === null ? <code>{code}</code> : <code dangerouslySetInnerHTML={{ __html: html }} />}
    </pre>
  );
}

const FENCE = /```(\w[\w-]*)?\n([\s\S]*?)```/g;

export function Markdown({ markdown }: { markdown: string }) {
  const blocks: ReactNode[] = [];
  let cursor = 0;
  let key = 0;

  const pushProse = (text: string) => {
    for (const para of text.split(/\n\s*\n/)) {
      const trimmed = para.trim();
      if (trimmed) blocks.push(<p key={key++}>{renderInline(trimmed.replace(/\n/g, ' '))}</p>);
    }
  };

  for (const match of markdown.matchAll(FENCE)) {
    pushProse(markdown.slice(cursor, match.index));
    blocks.push(<CodeBlock key={key++} code={(match[2] ?? '').trimEnd()} bad={match[1] === 'ts-bad'} />);
    cursor = (match.index ?? 0) + match[0].length;
  }
  pushProse(markdown.slice(cursor));

  return <div className="prose">{blocks}</div>;
}
