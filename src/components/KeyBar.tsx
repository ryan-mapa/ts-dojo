import type { PointerEvent } from 'react';
import type { editor } from 'monaco-editor';

/**
 * Touch accessory bar, the same idea every mobile code editor lands on.
 *
 * Two problems it solves. Tapping to place a cursor in a 14px monospace grid
 * means hitting a target a few pixels wide, and Monaco renders its own cursor
 * rather than using a native text field, so none of the platform's aids — the
 * iOS magnifier, the drag handles — are available. Arrow keys sidestep the
 * whole thing: tap roughly, then step exactly.
 *
 * The second is that TypeScript's alphabet lives two keyboard layers deep on a
 * phone. `<`, `>`, `{`, `|` and `=>` are most of what these exercises need.
 *
 * Shown only on coarse pointers — see the media query in styles.css.
 */

/**
 * Chosen by how buried each character is on a phone keyboard, not by raw
 * frequency. On iOS `< > { } [ ] | =` sit two layers deep, so they cost three
 * taps each; `; ( ) ' " ?` are one layer down, and `.` and `,` are on the
 * primary layer. So the deep ones earn their place here and the shallow ones
 * mostly do not, whatever their frequency.
 *
 * Dropped for that reason: `; ( ) , . '`. Also dropped are the closing `} ] )`,
 * since auto-closing brackets already insert them.
 *
 * `:` is the one exception — one layer down, but it opens nearly every
 * annotation in the curriculum.
 */
const SYMBOLS = [':', '=', '=>', '<', '>', '|', '?', '{', '['];

type Move = 'left' | 'right' | 'up' | 'down' | 'home' | 'end';

const KEYS = [
  ['left', '←', 'Move cursor left'],
  ['right', '→', 'Move cursor right'],
  ['up', '↑', 'Move cursor up'],
  ['down', '↓', 'Move cursor down'],
  ['home', '⇤', 'Start of line'],
  ['end', '⇥', 'End of line'],
] as const;

export function KeyBar({ editorRef }: { editorRef: { current: editor.IStandaloneCodeEditor | null } }) {
  /**
   * Implemented against setPosition/getLineMaxColumn rather than
   * `trigger('cursorLeft')`. Both work, but those command ids belong to
   * Monaco's internal core commands; the model API is public and documented.
   */
  const move = (direction: Move) => {
    const ed = editorRef.current;
    const model = ed?.getModel();
    const pos = ed?.getPosition();
    if (!ed || !model || !pos) return;

    let { lineNumber, column } = pos;
    switch (direction) {
      case 'left':
        if (column > 1) column -= 1;
        else if (lineNumber > 1) {
          lineNumber -= 1;
          column = model.getLineMaxColumn(lineNumber);
        }
        break;
      case 'right':
        if (column < model.getLineMaxColumn(lineNumber)) column += 1;
        else if (lineNumber < model.getLineCount()) {
          lineNumber += 1;
          column = 1;
        }
        break;
      case 'up':
        if (lineNumber > 1) {
          lineNumber -= 1;
          column = Math.min(column, model.getLineMaxColumn(lineNumber));
        }
        break;
      case 'down':
        if (lineNumber < model.getLineCount()) {
          lineNumber += 1;
          column = Math.min(column, model.getLineMaxColumn(lineNumber));
        }
        break;
      // Start of line means the first non-whitespace character, which on
      // indented code is where you actually want to land.
      case 'home':
        column = model.getLineFirstNonWhitespaceColumn(lineNumber) || 1;
        break;
      case 'end':
        column = model.getLineMaxColumn(lineNumber);
        break;
    }

    ed.setPosition({ lineNumber, column });
    ed.revealPositionInCenterIfOutsideViewport({ lineNumber, column });
    ed.focus();
  };

  const insert = (text: string) => {
    const ed = editorRef.current;
    if (!ed) return;
    // Routed through the `type` handler rather than executeEdits so it behaves
    // like real typing: auto-closing brackets and auto-indent still apply.
    ed.trigger('keybar', 'type', { text });
    ed.focus();
  };

  // Without this the button takes focus, the virtual keyboard dismisses, and
  // the page reflows under you on every single tap.
  const keepFocus = (e: PointerEvent) => e.preventDefault();

  // Two fixed rows rather than one scrolling one. A horizontally scrolling
  // toolbar hides half its own contents and competes with the page for touch
  // gestures; every key being visible is worth trimming the set for.
  return (
    <div className="keybar" role="toolbar" aria-label="Editor cursor and symbol keys">
      <div className="keybar-row">
        {KEYS.map(([dir, glyph, label]) => (
          <button key={dir} onPointerDown={keepFocus} onClick={() => move(dir)} aria-label={label}>
            {glyph}
          </button>
        ))}
      </div>

      <div className="keybar-row">
        <button onPointerDown={keepFocus} onClick={() => insert('  ')} aria-label="Indent">
          tab
        </button>
        {SYMBOLS.map((sym) => (
          <button key={sym} onPointerDown={keepFocus} onClick={() => insert(sym)} aria-label={`Insert ${sym}`}>
            {sym}
          </button>
        ))}
      </div>
    </div>
  );
}
