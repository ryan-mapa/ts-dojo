# ts-dojo

**[Open the app →](https://ryan-mapa.github.io/ts-dojo/)**

An interactive TypeScript trainer. You write TypeScript in a real editor, and a
real type checker decides whether you got it right.

No accounts, no server, no database. Pick a module and start.

54 exercises across 8 modules, from annotations through conditional types to
React — each one graded by a real compiler running in the browser.

## Why it works this way

Reading about types doesn't build type fluency — arguing with the compiler does.
So every exercise is graded the way [type-challenges][tc] grades: your code is
compiled together with a hidden file of type-level assertions, and the lesson
passes only when there are **zero** diagnostics across both.

```ts
// what you write
export type HttpMethod = (typeof HTTP_METHODS)[number];

// the hidden file it's compiled against
type _cases = [Expect<Equal<HttpMethod, 'GET' | 'POST' | 'PUT' | 'DELETE'>>];
```

`Expect<T extends true>` only accepts `true`, so a wrong answer surfaces as an
ordinary type error. The `Equal` helper uses the deferred-conditional trick, which
matters more than it looks: with a naive `extends` check, `any` satisfies every
assertion and you could pass the whole curriculum by annotating everything `any`.

Errors in your own file are shown in full. A failed assertion is not — its message
spells out the expected type, which would hand you the answer.

## The two compilers

TypeScript's npm `latest` is now **7.x, the Go-native port**: a platform binary
with no `tsserver` and no browser-runnable JS API. It cannot type-check in a tab.

So there are deliberately two:

| Where | Which |
|---|---|
| Browser — squiggles, hover, grading | Monaco's bundled worker (TypeScript 5.9) |
| Node — `typecheck`, exercise validation | `typescript@5.9.3`, pinned |

Same compiler version on both sides, so the in-app grader and CI can't disagree.
`src/engine/compilerOptions.ts` is the single source of the flags they share.

## Commands

```bash
npm run dev        # http://localhost:5173/ts-dojo/
npm run typecheck  # tsc -b across app, node and test projects
npm test           # engine + every exercise (see below)
npm run build      # production bundle
npm run smoke      # end-to-end browser check; needs `npm run dev` running
npm run mobile     # touch-layout check under iPhone emulation
npm run verify-deploy  # wait for THIS commit's CI run and report its conclusion
```

`verify-deploy` exists because `gh run list --limit 1` right after a push often
returns the *previous* commit's run — GitHub takes a few seconds to create the
new one — so it reports success for a deploy that has not started. It polls for
a run matching `HEAD` instead.

`npm test` type-checks all 54 exercises against real `tsc` and asserts two things
about each: the **solution compiles clean**, and the **starter does not**. That
second assertion is the one that earns its keep — an exercise whose starter
already satisfies the checks marks itself complete the moment you open it, and
teaches nothing. It has already caught one: TypeScript 5.5 infers type predicates
automatically, which quietly pre-solved the `isRecord` exercise.

`npm run smoke` drives a real Chrome via Playwright and is the only check that can
prove the Monaco worker actually boots and returns diagnostics — the plumbing
type-checks fine even when it silently does nothing. It covers one exercise of
each file type, because the worker resolves script kind from the extension
through a different path than the Node compiler host.

## On a phone

Monaco draws its own cursor rather than using a native text field, so none of
the platform's touch aids — the iOS magnifier, the selection handles — are
available, and placing a caret means hitting a target a few pixels wide. On
touch the editor therefore gets an accessory key bar: arrow keys to step the
cursor exactly, plus the characters that live two keyboard layers deep on a
phone (`<`, `>`, `{`, `|`, `=>`). Type is *smaller* — 12px — because the key bar
handles cursor precision, so the binding constraint becomes how much of a line
fits on a 390px screen. The gutter is trimmed to about 20px for the same reason:
two digits of line number, no folding column, glyph margin or overview ruler.
Hover cards, the context menu and the suggest widget are off, since all three
fight touch or blot out a small screen.

One non-obvious rule in `styles.css`: every `textarea` inside the editor is
pinned to 16px. Monaco's input is invisible, but iOS Safari zooms the page
whenever a focused input is under 16px, which strands the layout — so the
rendered font and the input font are deliberately unrelated. `npm run mobile`
asserts it, because the bug is invisible in a screenshot and Monaco has already
renamed that element once.

Detection lives in `src/lib/touch.ts` and deliberately corroborates
`(pointer: coarse)` with other signals: Chrome applies touch emulation
asynchronously, so the first page in a fresh browser can report
`pointer: fine` and `maxTouchPoints: 0` while genuinely being a touch context.
`npm run mobile` reports which signals it saw and asserts only on what the app
decided.

Solving an exercise is still much nicer with a keyboard. Reading a lesson is
fine anywhere.

## Curriculum

54 exercises across 8 modules.

| # | Module | | |
|---|---|---|---|
| 1 | Foundations & Inference | 8 | annotations vs inference, widening, `any` vs `unknown`, `as const` |
| 2 | Objects, Unions & Narrowing | 7 | discriminated unions, type predicates, exhaustiveness via `never` |
| 3 | Generics & Constraints | 5 | type parameters, `extends`, `keyof`, indexed access, defaults |
| 4 | Utility & Mapped Types | 7 | `Partial`/`Pick`/`Omit`/`Record`, then writing them yourself |
| 5 | Conditional & Template Literal Types | 7 | `infer`, distributivity, key remapping, recursion |
| 6 | Declaration Files & Ambient Types | 6 | `declare module`, wildcards, `declare global`, augmentation, overloads |
| 7 | Backend Patterns | 7 | schema inference, `Result`, branded types, `satisfies` |
| 8 | Typing React | 7 | props, `children`, `useState`, events, union props, generic components |

Everything through module 7 is backend Node — config objects, `fs/promises`, env
vars, HTTP handler shapes. No JSX until module 8.

## Lesson structure

Each exercise has three parts:

- **The concept** — the pre-read: what the feature is, why it exists, and worked
  examples showing the wrong way beside the right one.
- **Your task** — the instruction, kept short.
- **Going deeper** — the post-read, revealed only once the exercise passes. Because
  it comes after the answer it can discuss the solution directly and name the trap
  you may have just hit, which a pre-read cannot do without spoiling the exercise.

Examples in lesson text are **type-checked in CI** by fence tag, the same way the
exercises themselves are:

| fence | means |
|---|---|
| ```` ```ts ```` / ```` ```tsx ```` | must compile clean |
| ```` ```ts-bad ```` / ```` ```tsx-bad ```` | must NOT compile — it is illustrating an error |
| ```` ``` ```` | not checked |

This has already caught two mislabelled examples and one place where a claim in
the prose was true of real React but not of the stub the exercises run against.
A teaching example that quietly stops being true misleads with the full
authority of appearing in the lesson.

## Adding an exercise

Add an object to the array in `src/content/modules/`. The whole shape:

```ts
{
  id, title,
  brief,        // markdown-ish: paragraphs, `code`, *emphasis*
  starterCode,  // must FAIL the checks
  hiddenChecks, // Expect<Equal<...>> assertions, imports from './exercise'
  solution,     // must PASS the checks
  hints,        // progressive, cheapest first
}
```

Then run `npm test`. If your starter accidentally already passes, it fails the
suite rather than shipping.

### File types

`fileName` defaults to `exercise.ts`. Two others matter:

- **`exercise.tsx`** — JSX. Checked with `jsx: preserve` against a global `JSX`
  namespace, so there's no `react/jsx-runtime` to stub. Monaco has no TSX
  language mode, so JSX tags render uncolored; type checking is unaffected.
- **`exercise.d.ts`** — a *script* (no imports or exports at the top level).
  This is the only place `declare module 'x'` declares a **new** module rather
  than augmenting an existing one, which is what makes the "type an untyped
  package" exercises possible. The hidden checks then import from the module the
  exercise declared, rather than from `./exercise`.

### Ambient libs

Exercises get `Expect`, `Equal`, `NotEqual`, `ExpectFalse` and `Extends` as
globals, plus curated slices of `@types/node`, `@types/react` and `zod` — all in
`src/engine/libs/`, injected into the compiler as ambient libs. The real packages
are megabytes and would slow worker startup; extend a stub when an exercise needs
something it lacks.

The zod stub covers `string`/`number`/`boolean`/`object`/`array`/`optional` and,
most importantly, `z.infer`. Note that `z` is declared as a **namespace** merged
with values, not a const — that merging is what lets one name work in both the
value and type worlds, and declaring it as a const makes `z.infer` a "cannot find
namespace" error.

[tc]: https://github.com/type-challenges/type-challenges
