import { describe, it, expect } from 'vitest';
import { resumeExerciseId, keyOf } from '../src/store/progress';
import { MODULES } from '../src/content';
import type { Module } from '../src/content/types';

const mod = {
  id: 'demo',
  title: 'Demo',
  blurb: '',
  status: 'ready',
  exercises: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
} as unknown as Module;

const solved = (...ids: string[]) =>
  Object.fromEntries(ids.map((id) => [keyOf(mod.id, id), true as const]));

describe('resuming a module', () => {
  it('opens the first exercise when nothing is solved', () => {
    expect(resumeExerciseId(mod, {})).toBe('a');
  });

  it('skips past solved exercises', () => {
    expect(resumeExerciseId(mod, solved('a'))).toBe('b');
    expect(resumeExerciseId(mod, solved('a', 'b'))).toBe('c');
  });

  // Out-of-order solving is possible via the pip strip, so "first unsolved" has
  // to mean first by curriculum order, not first after the last solved one.
  it('returns the earliest gap, not the one after the last solved', () => {
    expect(resumeExerciseId(mod, solved('b', 'c'))).toBe('a');
  });

  it('falls back to exercise 1 once the module is finished', () => {
    expect(resumeExerciseId(mod, solved('a', 'b', 'c'))).toBe('a');
  });

  it('returns undefined for a module with no exercises', () => {
    expect(resumeExerciseId({ ...mod, exercises: [] }, {})).toBeUndefined();
  });

  it('resolves against real curriculum content', () => {
    const first = MODULES[0]!;
    expect(resumeExerciseId(first, {})).toBe(first.exercises[0]!.id);
    expect(resumeExerciseId(first, solvedIn(first, 0, 1))).toBe(first.exercises[2]!.id);
  });
});

function solvedIn(m: Module, ...indices: number[]) {
  return Object.fromEntries(indices.map((i) => [keyOf(m.id, m.exercises[i]!.id), true as const]));
}
