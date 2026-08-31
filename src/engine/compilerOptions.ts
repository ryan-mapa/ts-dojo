/**
 * Compiler flags shared by the two places TypeScript runs in this project: the
 * Monaco worker in the browser (grading + squiggles) and real `tsc` in the Node
 * test that validates the curriculum. Monaco 0.56 bundles TypeScript 5.9 and we
 * pin typescript@5.9.3, so the two agree on semantics.
 *
 * `target` / `module` / `moduleResolution` are deliberately absent: they're enums,
 * and each side supplies its own (the numeric values are identical, but importing
 * `typescript` into the browser bundle just to name them would cost megabytes).
 */
export const SHARED_FLAGS = {
  strict: true,
  noUncheckedIndexedAccess: true,
  noImplicitOverride: true,
  noFallthroughCasesInSwitch: true,
  skipLibCheck: true,
  noEmit: true,
  // Deliberately OFF. Exercises routinely declare a type that only the hidden
  // checks file consumes, and `type _cases = [...]` in checks.ts is unused by
  // construction. Turning these on would fail every correct solution.
  noUnusedLocals: false,
  noUnusedParameters: false,
} as const;

/**
 * Monaco re-exports its own copies of these enums, and they are stale: its
 * `ScriptTarget` stops at ES2020 and its `ModuleResolutionKind` only knows
 * Classic and NodeJs. The TypeScript 5.9 worker *behind* that API understands
 * the modern values perfectly well, so we pass the numbers directly.
 *
 * Verified against typescript@5.9.3 rather than remembered — the Node-side test
 * uses the real `ts.ScriptTarget` enum, so a drift here shows up as the browser
 * and CI disagreeing about an exercise.
 */
export const TARGET_ES2022 = 9;
export const MODULE_ESNEXT = 99;
export const MODULE_RESOLUTION_BUNDLER = 100;
/**
 * `preserve` rather than `react-jsx` on purpose. `react-jsx` makes the checker
 * resolve `react/jsx-runtime`, which would mean stubbing the runtime module as
 * well; `preserve` still type-checks JSX fully against the global JSX namespace
 * and we never emit anyway.
 */
export const JSX_PRESERVE = 1;

/** Most exercises are a plain module. React ones are `.tsx`; declaration-file
 *  ones are `.d.ts` scripts, where `declare module` is ambient rather than an
 *  augmentation of an existing module. */
export const DEFAULT_EXERCISE_FILE = 'exercise.ts';

export const exerciseUri = (fileName = DEFAULT_EXERCISE_FILE) => `file:///${fileName}`;
export const CHECKS_URI = 'file:///checks.ts';
