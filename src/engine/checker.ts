import * as monaco from 'monaco-editor';
import assertLib from './libs/assert.d.ts?raw';
import nodeStubs from './libs/node-stubs.d.ts?raw';
import {
  SHARED_FLAGS,
  EXERCISE_URI,
  CHECKS_URI,
  TARGET_ES2022,
  MODULE_ESNEXT,
  MODULE_RESOLUTION_BUNDLER,
} from './compilerOptions';
import { flattenMessage, type Diag } from './diagnostics';

// monaco 0.56 moved this out of `languages`: `monaco.languages.typescript` is
// now a `{ deprecated: true }` stub that type-errors the moment you touch it.
const ts = monaco.typescript;

export interface GradeResult {
  passed: boolean;
  /** Errors in the user's own file. Safe to show verbatim, with line numbers. */
  exerciseDiagnostics: Diag[];
  /** Failed assertions from the hidden checks file. Shown WITHOUT the message,
   *  which would otherwise print the expected type and give away the answer. */
  failedAssertions: number;
  /** True when the user's file doesn't even parse, so assertions are meaningless. */
  hasSyntaxErrors: boolean;
}

let configured = false;

/** Idempotent: safe to call from a component effect that may run twice in StrictMode. */
export function configureTypeScript(): void {
  if (configured) return;
  configured = true;

  ts.typescriptDefaults.setCompilerOptions({
    ...SHARED_FLAGS,
    target: TARGET_ES2022 as monaco.typescript.ScriptTarget,
    module: MODULE_ESNEXT as monaco.typescript.ModuleKind,
    moduleResolution: MODULE_RESOLUTION_BUNDLER as monaco.typescript.ModuleResolutionKind,
    allowNonTsExtensions: true,
  });

  // Without this the worker only sees a model's contents when the editor decides
  // to flush, which makes grading race against typing.
  ts.typescriptDefaults.setEagerModelSync(true);

  ts.typescriptDefaults.setExtraLibs([
    { content: assertLib, filePath: 'file:///lib/assert.d.ts' },
    { content: nodeStubs, filePath: 'file:///lib/node-stubs.d.ts' },
  ]);
}

/** Get an existing model or create it. Models are keyed by URI and outlive any
 *  single exercise, so we reuse the same two for the whole session. */
function upsertModel(uri: string, value: string): monaco.editor.ITextModel {
  const parsed = monaco.Uri.parse(uri);
  const existing = monaco.editor.getModel(parsed);
  if (existing) {
    if (existing.getValue() !== value) existing.setValue(value);
    return existing;
  }
  return monaco.editor.createModel(value, 'typescript', parsed);
}

/**
 * Install the hidden assertions for an exercise.
 *
 * Note what this deliberately does NOT do: touch the exercise model. That one is
 * owned by the <Editor>, which creates it from `path` and keeps it in sync with
 * what the user types. If we also wrote to it here, every re-render would stomp
 * on in-progress edits.
 */
export function loadChecks(hiddenChecks: string): void {
  configureTypeScript();
  upsertModel(CHECKS_URI, hiddenChecks);
}

function toDiag(d: monaco.typescript.Diagnostic, model: monaco.editor.ITextModel): Diag {
  const pos = model.getPositionAt(d.start ?? 0);
  return {
    line: pos.lineNumber,
    column: pos.column,
    message: flattenMessage(d.messageText as string),
    code: d.code,
  };
}

/**
 * Grade the current contents of the exercise model against the hidden checks.
 *
 * Passing means zero diagnostics across BOTH files. The split matters for the
 * UI: errors in exercise.ts are the user's own and get shown in full, while an
 * error in checks.ts means "your type isn't what was asked for" and must stay
 * opaque, because its message spells out the expected type.
 */
export async function grade(): Promise<GradeResult> {
  const worker = await ts.getTypeScriptWorker();
  const exerciseModel = monaco.editor.getModel(monaco.Uri.parse(EXERCISE_URI));
  if (!exerciseModel) throw new Error('grade() called before loadExercise()');

  const client = await worker(monaco.Uri.parse(EXERCISE_URI), monaco.Uri.parse(CHECKS_URI));

  const [syntactic, semantic, checkSemantic, checkSyntactic] = await Promise.all([
    client.getSyntacticDiagnostics(EXERCISE_URI),
    client.getSemanticDiagnostics(EXERCISE_URI),
    client.getSemanticDiagnostics(CHECKS_URI),
    client.getSyntacticDiagnostics(CHECKS_URI),
  ]);

  const exerciseDiagnostics = [...syntactic, ...semantic].map((d) => toDiag(d, exerciseModel));
  // A syntax error in checks.ts is our authoring bug, not the learner's, but it
  // still has to block a pass rather than silently counting as success.
  const failedAssertions = checkSemantic.length + checkSyntactic.length;

  return {
    passed: exerciseDiagnostics.length === 0 && failedAssertions === 0,
    exerciseDiagnostics,
    failedAssertions,
    hasSyntaxErrors: syntactic.length > 0,
  };
}

/** Push diagnostics into the editor gutter as red squiggles. */
export function renderMarkers(model: monaco.editor.ITextModel, diags: Diag[]): void {
  monaco.editor.setModelMarkers(
    model,
    'ts-dojo',
    diags.map((d) => ({
      severity: monaco.MarkerSeverity.Error,
      message: d.message,
      startLineNumber: d.line,
      startColumn: d.column,
      endLineNumber: d.line,
      endColumn: d.column + 1,
    })),
  );
}
