# ts-dojo

An interactive TypeScript trainer. You write TypeScript in a real editor, and a
real type checker decides whether you got it right.

No accounts, no server, no database. Pick a module and start.

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
```

`npm test` type-checks all 20 exercises against real `tsc` and asserts two things
about each: the **solution compiles clean**, and the **starter does not**. That
second assertion is the one that earns its keep — an exercise whose starter
already satisfies the checks marks itself complete the moment you open it, and
teaches nothing. It has already caught one: TypeScript 5.5 infers type predicates
automatically, which quietly pre-solved the `isRecord` exercise.

`npm run smoke` drives a real Chrome via Playwright and is the only check that can
prove the Monaco worker actually boots and returns diagnostics — the plumbing
type-checks fine even when it silently does nothing.

## Curriculum

1. **Foundations & Inference** — 8 exercises
2. **Objects, Unions & Narrowing** — 7 exercises
3. **Generics & Constraints** — 5 exercises
4. Utility & Mapped Types *(not written yet)*
5. Conditional & Template Literal Types *(not written yet)*
6. Modules, Declaration Files & tsconfig *(not written yet)*
7. Backend Patterns *(not written yet)*
8. Typing React *(not written yet)*

Everything through module 3 is backend Node — config objects, `fs/promises`, env
vars, HTTP handler shapes. No JSX until module 8.

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

Exercises get `Expect`, `Equal`, `NotEqual`, `ExpectFalse` and `Extends` as
globals, plus a curated slice of `@types/node` — both in
`src/engine/libs/`, injected into the compiler as ambient libs. Full
`@types/node` is megabytes and would slow worker startup; extend the stub when an
exercise needs something it lacks.

[tc]: https://github.com/type-challenges/type-challenges
