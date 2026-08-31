import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
