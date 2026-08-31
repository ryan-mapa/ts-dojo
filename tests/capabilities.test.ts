import { describe, it, expect } from 'vitest';
import { checkExercise, formatDiagnostics } from './tsCheck';

describe('ambient .d.ts exercises', () => {
  it('lets a script .d.ts declare a module the checks can import', () => {
    const code = [
      "declare module 'legacy-logger' {",
      '  export function createLogger(name: string): { info(msg: string): void };',
      '}',
    ].join('\n');
    const checks = [
      "import type { createLogger } from 'legacy-logger';",
      'type _cases = [',
      '  Expect<Equal<typeof createLogger, (name: string) => { info(msg: string): void }>>,',
      '];',
    ].join('\n');
    expect(formatDiagnostics(checkExercise(code, checks, 'exercise.d.ts'))).toBe('');
  });

  it('fails when the ambient declaration is missing the export', () => {
    const code = "declare module 'legacy-logger' {}";
    const checks = "import type { createLogger } from 'legacy-logger';\nexport type X = typeof createLogger;";
    expect(checkExercise(code, checks, 'exercise.d.ts').length).toBeGreaterThan(0);
  });
});

describe('tsx exercises', () => {
  it('type-checks JSX against the React stubs', () => {
    const code = [
      "import type { ReactNode } from 'react';",
      'export interface BadgeProps { label: string; children?: ReactNode }',
      'export function Badge({ label }: BadgeProps) {',
      '  return <span>{label}</span>;',
      '}',
    ].join('\n');
    const checks = [
      "import type { BadgeProps } from './exercise';",
      'type _cases = [Expect<Equal<BadgeProps["label"], string>>];',
    ].join('\n');
    expect(formatDiagnostics(checkExercise(code, checks, 'exercise.tsx'))).toBe('');
  });

  it('still catches type errors inside JSX', () => {
    const code = [
      'export function Badge({ label }: { label: string }) {',
      '  return <span>{label.toFixed(2)}</span>;',
      '}',
      'export type X = string;',
    ].join('\n');
    const checks = "import type { X } from './exercise';\ntype _c = [Expect<Equal<X, string>>];";
    expect(checkExercise(code, checks, 'exercise.tsx').length).toBeGreaterThan(0);
  });

  it('types useState through the stub', () => {
    const code = [
      "import { useState } from 'react';",
      'export function useCounter() {',
      '  const [n, setN] = useState(0);',
      '  setN((prev) => prev + 1);',
      '  return n;',
      '}',
    ].join('\n');
    const checks = [
      "import type { useCounter } from './exercise';",
      'type _cases = [Expect<Equal<ReturnType<typeof useCounter>, number>>];',
    ].join('\n');
    expect(formatDiagnostics(checkExercise(code, checks, 'exercise.tsx'))).toBe('');
  });
});

describe('zod stubs', () => {
  it('derives a static type from a schema with z.infer', () => {
    const code = [
      "import { z } from 'zod';",
      'export const userSchema = z.object({',
      '  id: z.string(),',
      '  age: z.number(),',
      '});',
      'export type User = z.infer<typeof userSchema>;',
    ].join('\n');
    const checks = [
      "import type { User } from './exercise';",
      'type _cases = [Expect<Equal<User, { id: string; age: number }>>];',
    ].join('\n');
    expect(formatDiagnostics(checkExercise(code, checks, 'exercise.ts'))).toBe('');
  });

  it('models optional fields', () => {
    const code = [
      "import { z } from 'zod';",
      'export const s = z.object({ name: z.string(), nick: z.string().optional() });',
      'export type S = z.infer<typeof s>;',
    ].join('\n');
    const checks = [
      "import type { S } from './exercise';",
      'type _cases = [Expect<Equal<S, { name: string; nick?: string | undefined }>>];',
    ].join('\n');
    expect(formatDiagnostics(checkExercise(code, checks, 'exercise.ts'))).toBe('');
  });
});
