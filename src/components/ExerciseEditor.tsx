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

interface Props {
  exercise: Exercise;
  initialCode: string;
  onCodeChange: (code: string) => void;
  onPass: () => void;
  /** Increments when the hint panel asks for the solution to be pasted in. */
  revealSignal: number;
}

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
            fontSize: 14,
            scrollBeyondLastLine: false,
            tabSize: 2,
            renderLineHighlight: 'none',
            padding: { top: 16, bottom: 16 },
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
