export interface Exercise {
  id: string;
  title: string;
  /** Markdown. The concept, then the concrete task. */
  brief: string;
  /**
   * Defaults to `exercise.ts`. Use `exercise.tsx` for JSX, or `exercise.d.ts`
   * for declaration-file exercises — a `.d.ts` with no imports or exports is a
   * *script*, which is the only place `declare module 'x'` declares a new
   * module instead of augmenting an existing one.
   */
  fileName?: string;
  /** Seeded into the editor. Must FAIL the hidden checks (enforced by tests). */
  starterCode: string;
  /** Appended as a separate hidden file that imports from the exercise. */
  hiddenChecks: string;
  /** Must PASS the hidden checks (enforced by tests). */
  solution: string;
  /** Progressive: cheapest nudge first, near-answer last. */
  hints: string[];
}

export interface Module {
  id: string;
  title: string;
  blurb: string;
  /** Locked modules are visible on the picker but have no exercises yet. */
  status: 'ready' | 'planned';
  exercises: Exercise[];
}
