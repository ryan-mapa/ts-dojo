import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Module } from '../content/types';

type Key = string; // `${moduleId}/${exerciseId}`

interface ProgressState {
  completed: Record<Key, true>;
  /** Work-in-progress code, so a reload doesn't throw away a half-finished attempt. */
  drafts: Record<Key, string>;
  markComplete: (key: Key) => void;
  saveDraft: (key: Key, code: string) => void;
  reset: () => void;
}

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      completed: {},
      drafts: {},
      markComplete: (key) => set((s) => ({ completed: { ...s.completed, [key]: true } })),
      saveDraft: (key, code) => set((s) => ({ drafts: { ...s.drafts, [key]: code } })),
      reset: () => set({ completed: {}, drafts: {} }),
    }),
    { name: 'ts-dojo-progress' },
  ),
);

export const keyOf = (moduleId: string, exerciseId: string): Key => `${moduleId}/${exerciseId}`;

/**
 * Which exercise a module should open on when the URL names no specific one:
 * the first still unsolved, so re-entering a half-finished module drops you
 * where you left off rather than back at exercise 1.
 *
 * A fully solved module reopens at its first exercise — there is no unsolved
 * one left to pick, and the top is the natural place to review from.
 */
export function resumeExerciseId(mod: Module, completed: Record<Key, true>): string | undefined {
  const unsolved = mod.exercises.find((e) => !completed[keyOf(mod.id, e.id)]);
  return (unsolved ?? mod.exercises[0])?.id;
}
