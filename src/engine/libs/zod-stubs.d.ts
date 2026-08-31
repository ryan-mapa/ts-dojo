// A curated slice of zod, for the backend-patterns module.
//
// Only the core is modelled: the point of the exercise is `z.infer<typeof
// schema>` — deriving a static type from a runtime validator so the two can
// never drift. That single idea is most of zod's value in a TypeScript codebase.
//
// The API shape here matches real zod for what it covers, so what you learn
// transfers. It is not a runtime implementation: nothing here executes.

declare module 'zod' {
  export interface ZodType<Output> {
    /** Real zod carries the output type on a phantom property much like this.
     *  It is what `z.infer` reads. */
    readonly _output: Output;
    parse(data: unknown): Output;
    safeParse(data: unknown): { success: true; data: Output } | { success: false };
    optional(): ZodOptional<Output>;
  }

  export interface ZodOptional<Output> extends ZodType<Output | undefined> {}
  export interface ZodString extends ZodType<string> {
    min(n: number): ZodString;
    email(): ZodString;
  }
  export interface ZodNumber extends ZodType<number> {
    int(): ZodNumber;
    positive(): ZodNumber;
  }
  export interface ZodBoolean extends ZodType<boolean> {}
  export interface ZodArray<T> extends ZodType<T[]> {}

  export type ZodRawShape = Record<string, ZodType<unknown>>;

  type RequiredKeys<S extends ZodRawShape> = {
    [K in keyof S]: undefined extends S[K]['_output'] ? never : K;
  }[keyof S];

  type OptionalKeys<S extends ZodRawShape> = {
    [K in keyof S]: undefined extends S[K]['_output'] ? K : never;
  }[keyof S];

  /** Flattens the required/optional intersection back into one object type, so
   *  the inferred type reads the way a hand-written interface would. */
  type Prettify<T> = { [K in keyof T]: T[K] };

  export type InferShape<S extends ZodRawShape> = Prettify<
    { [K in RequiredKeys<S>]: S[K]['_output'] } & {
      [K in OptionalKeys<S>]?: S[K]['_output'];
    }
  >;

  export interface ZodObject<S extends ZodRawShape> extends ZodType<InferShape<S>> {
    shape: S;
  }

  // In real zod `z` is a namespace merged with values, which is what lets
  // `z.object(...)` and `z.infer<...>` share one name across the value and type
  // worlds. Declaring it as a const would make `z.infer` a "cannot find
  // namespace" error.
  export namespace z {
    export function string(): ZodString;
    export function number(): ZodNumber;
    export function boolean(): ZodBoolean;
    export function object<S extends ZodRawShape>(shape: S): ZodObject<S>;
    export function array<T>(element: ZodType<T>): ZodArray<T>;
    /** The whole point: one schema, and the static type comes from it. */
    export type infer<T extends ZodType<unknown>> = T['_output'];
  }
}
