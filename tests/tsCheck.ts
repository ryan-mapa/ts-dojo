import ts from 'typescript';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SHARED_FLAGS } from '../src/engine/compilerOptions';

const here = dirname(fileURLToPath(import.meta.url));
const libsDir = join(here, '../src/engine/libs');

const lib = (name: string) => readFileSync(join(libsDir, name), 'utf8');

const OPTIONS: ts.CompilerOptions = {
  ...SHARED_FLAGS,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.Preserve,
};

/**
 * Type-check an exercise the same way the browser does: the user's file plus the
 * hidden checks file plus the ambient libs, all in one program. Returns every
 * diagnostic so callers can assert on emptiness (solutions) or non-emptiness
 * (starters).
 */
export function checkExercise(
  code: string,
  hiddenChecks: string,
  fileName = 'exercise.ts',
): ts.Diagnostic[] {
  const files: Record<string, string> = {
    [`/${fileName}`]: code,
    '/checks.ts': hiddenChecks,
    '/lib/assert.d.ts': lib('assert.d.ts'),
    '/lib/node-stubs.d.ts': lib('node-stubs.d.ts'),
    '/lib/react-stubs.d.ts': lib('react-stubs.d.ts'),
    '/lib/zod-stubs.d.ts': lib('zod-stubs.d.ts'),
  };

  const defaultLibName = ts.getDefaultLibFilePath(OPTIONS);
  const host: ts.CompilerHost = {
    fileExists: (f) => f in files || f === defaultLibName || ts.sys.fileExists(f),
    readFile: (f) => files[f] ?? ts.sys.readFile(f),
    getSourceFile: (f, langVersion) => {
      const text = files[f] ?? ts.sys.readFile(f);
      return text === undefined ? undefined : ts.createSourceFile(f, text, langVersion, true);
    },
    getDefaultLibFileName: () => defaultLibName,
    writeFile: () => {},
    getCurrentDirectory: () => '/',
    getCanonicalFileName: (f) => f,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => '\n',
  };

  const program = ts.createProgram(Object.keys(files), OPTIONS, host);
  return [
    ...program.getSyntacticDiagnostics(),
    ...program.getSemanticDiagnostics(),
  ];
}

export function formatDiagnostics(diags: ts.Diagnostic[]): string {
  return diags
    .map((d) => `${d.file?.fileName ?? '?'}: ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`)
    .join('\n');
}
