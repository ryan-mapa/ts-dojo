export interface Exercise {
  id: string;
  title: string;
  /**
   * Pre-read. The concept itself: what the feature is, why it exists, and a
   * worked example. Optional so an exercise can be added without one, but every
   * exercise in a `ready` module should have it.
   */
  concept?: string;
  /** Markdown. The task — what to actually change, kept short. */
  brief: string;
  /**
   * Post-read, revealed only once the exercise passes. Because it comes after
   * the answer it can name the trap you may have just hit, discuss the solution
   * directly, and point at where this shows up in real code — none of which it
   * could do beforehand without spoiling the exercise.
   */
  debrief?: string;
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
