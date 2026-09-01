import { useCallback, useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import {
  configureTypeScript,
  disposeOtherExerciseModels,
  grade,
  loadChecks,
  type GradeResult,
} from '../engine/checker';
import { exerciseUri } from '../engine/compilerOptions';
import type { Exercise } from '../content/types';
import { KeyBar } from './KeyBar';
import { isTouchLayout } from '../lib/touch';

interface Props {
  exercise: Exercise;
  initialCode: string;
  onCodeChange: (code: string) => void;
  onPass: () => void;
  /** Increments when the hint panel asks for the solution to be pasted in. */
  revealSignal: number;
}

const COARSE_POINTER = isTouchLayout();

export function ExerciseEditor({ exercise, initialCode, onCodeChange, onPass, revealSignal }: Props) {
  const [result, setResult] = useState<GradeResult | null>(null);
  const [checking, setChecking] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // Register compiler options and the ambient libs before Monaco spins up its
  // worker, otherwise the first exercise renders with the wrong diagnostics.
  useEffect(() => {
    configureTypeScript();
  }, []);

  // The checks model lives alongside the editor's model but is never displayed.
  // Note there's no `setResult(null)` here: the parent keys this component on
  // exercise.id, so switching exercises remounts it with fresh state already.
  const uri = exerciseUri(exercise.fileName);

  useEffect(() => {
    loadChecks(exercise.hiddenChecks);
    disposeOtherExerciseModels(uri);
  }, [exercise.hiddenChecks, uri]);

  const check = useCallback(async () => {
    setChecking(true);
    try {
      const r = await grade(exercise.fileName);
      setResult(r);
      if (r.passed) onPass();
    } finally {
      setChecking(false);
    }
  }, [onPass, exercise.fileName]);

  const showSolution = useCallback(() => {
    editorRef.current?.setValue(exercise.solution);
  }, [exercise.solution]);

  // Skip the initial render: signal 0 means "nobody has asked yet".
  useEffect(() => {
    if (revealSignal > 0) showSolution();
  }, [revealSignal, showSolution]);

  return (
    <div className="workbench">
      {COARSE_POINTER && <KeyBar editorRef={editorRef} />}

      <div className="editor-shell">
        <Editor
          key={exercise.id}
          path={uri}
          defaultLanguage="typescript"
          defaultValue={initialCode}
          theme="vs-dark"
          onMount={(ed) => {
            editorRef.current = ed;
          }}
          onChange={(v) => onCodeChange(v ?? '')}
          options={{
            minimap: { enabled: false },
            // Smaller on touch, which is the opposite of the obvious call. Big
            // type was there to make the tap target for placing a cursor
            // bigger — but the key bar's arrows do that job now, and the real
            // constraint on a 390px screen is how much of a line you can see.
            fontSize: COARSE_POINTER ? 13 : 14,
            lineHeight: COARSE_POINTER ? 21 : 0,
            // Wrap rather than scroll sideways. Horizontal scrolling inside a
            // vertically scrolling page is miserable on touch, and code you
            // cannot see is worse than code on two lines.
            wordWrap: COARSE_POINTER ? 'on' : 'off',
            wrappingIndent: 'indent',
            // The gutter measured 74px on an iPhone — 21% of the editor — for
            // exercises that are never more than ~20 lines long. Two digits of
            // line number is plenty; the folding column and the decoration
            // margin are pure loss at this width.
            lineNumbersMinChars: COARSE_POINTER ? 2 : 3,
            // Not 0: that leaves the line number touching the code. A few pixels
            // buys the separation back and still costs almost nothing.
            lineDecorationsWidth: COARSE_POINTER ? 6 : 10,
            folding: !COARSE_POINTER,
            glyphMargin: false,
            overviewRulerLanes: COARSE_POINTER ? 0 : 2,
            overviewRulerBorder: !COARSE_POINTER,
            scrollbar: {
              verticalScrollbarSize: COARSE_POINTER ? 6 : 12,
              horizontalScrollbarSize: COARSE_POINTER ? 6 : 12,
            },
            scrollBeyondLastLine: false,
            tabSize: 2,
            renderLineHighlight: 'none',
            padding: { top: 16, bottom: 16 },
            // A fatter caret is much easier to actually see on a phone.
            cursorWidth: COARSE_POINTER ? 3 : 2,
            // These are all hostile on touch: long-press fights the context
            // menu, hover cards fire on tap and cover the code, and the
            // suggest widget blots out a small screen. Hover is a headline
            // feature on desktop, so it stays there.
            contextmenu: !COARSE_POINTER,
            // Not a boolean in monaco 0.56: 'on' | 'off' | 'onKeyboardModifier'.
            hover: { enabled: COARSE_POINTER ? 'off' : 'on' },
            quickSuggestions: !COARSE_POINTER,
          }}
        />
      </div>

      <div className="results">
        <button className="primary" onClick={check} disabled={checking}>
          {checking ? 'Checking…' : 'Check my answer'}
        </button>
        <Verdict result={result} onShowSolution={showSolution} />
      </div>
    </div>
  );
}

function Verdict({ result, onShowSolution }: { result: GradeResult | null; onShowSolution: () => void }) {
  if (!result) return <p className="muted">Hover any value to see what TypeScript inferred.</p>;

  if (result.passed) {
    return (
      <p className="verdict pass">
        Zero type errors. <strong>Solved.</strong>
      </p>
    );
  }

  return (
    <div className="verdict fail">
      {result.exerciseDiagnostics.length > 0 && (
        <ul className="diags">
          {result.exerciseDiagnostics.map((d, i) => (
            <li key={i}>
              <span className="loc">
                {d.line}:{d.column}
              </span>
              <span className="msg">{d.message}</span>
              <span className="code">ts({d.code})</span>
            </li>
          ))}
        </ul>
      )}

      {/* The checks file's own message spells out the expected type, so it is
          deliberately never shown — only the fact that an assertion failed. */}
      {result.exerciseDiagnostics.length === 0 && result.failedAssertions > 0 && (
        <p>
          Your code compiles, but the type isn&rsquo;t what the exercise asked for.{' '}
          <button className="link" onClick={onShowSolution}>
            reveal the solution
          </button>
        </p>
      )}

      {result.hasSyntaxErrors && <p className="muted">Fix the syntax first — the rest is noise until then.</p>}
    </div>
  );
}
