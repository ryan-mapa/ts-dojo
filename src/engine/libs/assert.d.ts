// Registered into the TS worker as an extraLib so every exercise can use these
// globally, without an import. This is the type-challenges formulation of Equal:
// the two identical-looking conditional types are compared as *deferred*
// conditionals, which is the only trick that makes `any` fail against a concrete
// type. A naive `X extends Y ? Y extends X ? true : false : false` would let
// `any` pass every single assertion, which would silently break every exercise.
type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;

type NotEqual<X, Y> = Equal<X, Y> extends true ? false : true;

// `Expect` only accepts `true`, so a failed Equal surfaces as a real type error.
type Expect<T extends true> = T;
type ExpectFalse<T extends false> = T;

// Handy for "is this assignable" style checks where exact equality is too strict.
type Extends<A, B> = A extends B ? true : false;
