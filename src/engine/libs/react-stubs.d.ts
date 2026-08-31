// A curated slice of @types/react, for the "Typing React" module only.
//
// The real @types/react is enormous and models twenty years of API surface.
// Exercises need props, children, hooks and events — so that is what this
// declares. The signatures are faithful to the real ones for the subset covered;
// where they are simplified, the simplification is noted.

type ReactNode =
  | string
  | number
  | boolean
  | null
  | undefined
  | ReactElement
  | Iterable<ReactNode>;

interface ReactElement {
  readonly type: unknown;
  readonly props: unknown;
}

// With `jsx: preserve` and no jsxImportSource, TypeScript checks JSX against
// this global namespace. Intrinsic elements are loose on purpose: these
// exercises are about typing *your* components, not about re-deriving the HTML
// attribute surface.
declare namespace JSX {
  interface Element extends ReactElement {}
  interface ElementChildrenAttribute {
    children: object;
  }
  interface IntrinsicElements {
    [elemName: string]: Record<string, unknown>;
  }
}

declare module 'react' {
  export type { ReactNode, ReactElement };

  /** The modern function-component type. Note it has no implicit `children` —
   *  that was removed in React 18's types, and is a common source of confusion. */
  export type FC<P = {}> = (props: P) => ReactElement | null;
  export type PropsWithChildren<P = unknown> = P & { children?: ReactNode };

  export type Dispatch<A> = (value: A) => void;
  export type SetStateAction<S> = S | ((prev: S) => S);

  export function useState<S>(initial: S): [S, Dispatch<SetStateAction<S>>];
  export function useState<S = undefined>(): [
    S | undefined,
    Dispatch<SetStateAction<S | undefined>>,
  ];
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
  export function useCallback<T extends (...args: never[]) => unknown>(
    fn: T,
    deps: readonly unknown[],
  ): T;
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
  export function useRef<T>(initial: T): { current: T };

  export interface SyntheticEvent<T = Element> {
    currentTarget: T;
    preventDefault(): void;
    stopPropagation(): void;
  }
  export interface ChangeEvent<T = Element> extends SyntheticEvent<T> {
    target: T & { value: string };
  }
  export interface MouseEvent<T = Element> extends SyntheticEvent<T> {
    clientX: number;
    clientY: number;
  }
  export type ChangeEventHandler<T = Element> = (event: ChangeEvent<T>) => void;
  export type MouseEventHandler<T = Element> = (event: MouseEvent<T>) => void;
}
