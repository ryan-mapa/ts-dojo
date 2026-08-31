import { describe, it, expect } from 'vitest';
import { checkExercise, formatDiagnostics } from './tsCheck';

const CHECKS = [
  "import type { Answer } from './exercise';",
  'type _cases = [Expect<Equal<Answer, string>>];',
].join('\n');

describe('the grader itself', () => {
  it('passes code that satisfies the assertions', () => {
    const diags = checkExercise('export type Answer = string;', CHECKS);
    expect(formatDiagnostics(diags)).toBe('');
  });

  it('fails code that does not', () => {
    expect(checkExercise('export type Answer = number;', CHECKS).length).toBeGreaterThan(0);
  });

  // The whole curriculum rests on this. With a naive bidirectional-extends
  // definition of Equal, `any` satisfies every assertion, so a learner could
  // pass every single exercise by annotating everything `any` and learn the
  // exact opposite of the lesson.
  it('does not let `any` satisfy an assertion', () => {
    expect(checkExercise('export type Answer = any;', CHECKS).length).toBeGreaterThan(0);
  });

  it('reports unresolved imports rather than silently passing', () => {
    const diags = checkExercise("import { nope } from './nowhere';\nexport type Answer = string;", CHECKS);
    expect(diags.length).toBeGreaterThan(0);
  });

  it('enforces strict mode', () => {
    const diags = checkExercise('export function f(x) { return x; }\nexport type Answer = string;', CHECKS);
    expect(formatDiagnostics(diags)).toContain('implicitly has an');
  });

  it('enforces noUncheckedIndexedAccess', () => {
    const code = [
      'const xs: string[] = [];',
      'const first: string = xs[0];',
      'export type Answer = string;',
    ].join('\n');
    expect(checkExercise(code, CHECKS).length).toBeGreaterThan(0);
  });

  it('exposes the Node stubs to exercise code', () => {
    const code = [
      "import { join } from 'node:path';",
      "export const p = join('a', 'b');",
      'export type Answer = string;',
    ].join('\n');
    expect(formatDiagnostics(checkExercise(code, CHECKS))).toBe('');
  });
});

describe('browser/Node compiler parity', () => {
  it('hardcoded enum values match the real TypeScript enums', async () => {
    const ts = (await import('typescript')).default;
    const { TARGET_ES2022, MODULE_ESNEXT, MODULE_RESOLUTION_BUNDLER } = await import(
      '../src/engine/compilerOptions'
    );
    // The browser can't import `typescript` (23MB), so checker.ts passes these
    // as raw numbers. If a future TypeScript ever renumbers them, the in-app
    // grader would silently start compiling under different settings than CI.
    expect(TARGET_ES2022).toBe(ts.ScriptTarget.ES2022);
    expect(MODULE_ESNEXT).toBe(ts.ModuleKind.ESNext);
    expect(MODULE_RESOLUTION_BUNDLER).toBe(ts.ModuleResolutionKind.Bundler);
  });
});
