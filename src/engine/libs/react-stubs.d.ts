// A curated slice of @types/react, for the "Typing React" module only.
//
// The real @types/react is enormous and models twenty years of API surface.
// Exercises need props, children, hooks and events — so that is what this
// declares. The signatures are faithful to the real ones for the subset covered.
//
// Note the event types are declared globally under React-prefixed names and
// re-exported from 'react' below. They cannot be declared globally under their
// own names because `MouseEvent` and `KeyboardEvent` already exist as DOM
// globals with different shapes, and the JSX namespace (which is global) needs
// to reference them.

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

interface ReactSyntheticEvent<T = Element> {
  currentTarget: T;
  /** Whatever was actually clicked, which may be a descendant of currentTarget. */
  target: T;
  preventDefault(): void;
  stopPropagation(): void;
}

interface ReactChangeEvent<T = Element> extends ReactSyntheticEvent<T> {
  target: T & { value: string };
}

interface ReactMouseEvent<T = Element> extends ReactSyntheticEvent<T> {
  clientX: number;
  clientY: number;
}

// With `jsx: preserve` and no jsxImportSource, TypeScript checks JSX against
// this global namespace.
declare namespace JSX {
  interface Element extends ReactElement {}
  interface ElementChildrenAttribute {
    children: object;
  }
  interface IntrinsicElements {
    // A few elements carry real handler types, because contextual typing of
    // inline event handlers is itself one of the lessons — with a loose
    // `unknown` here, the callback parameter would be an implicit `any` and the
    // lesson would be teaching the opposite of the truth.
    input: {
      value?: string;
      type?: string;
      onChange?: (event: ReactChangeEvent<HTMLInputElement>) => void;
      [key: string]: unknown;
    };
    textarea: {
      value?: string;
      onChange?: (event: ReactChangeEvent<HTMLTextAreaElement>) => void;
      [key: string]: unknown;
    };
    button: {
      onClick?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
      [key: string]: unknown;
    };
    // Everything else stays loose: these exercises are about typing *your*
    // components, not about re-deriving the HTML attribute surface.
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

  export type SyntheticEvent<T = Element> = ReactSyntheticEvent<T>;
  export type ChangeEvent<T = Element> = ReactChangeEvent<T>;
  export type MouseEvent<T = Element> = ReactMouseEvent<T>;
  export type ChangeEventHandler<T = Element> = (event: ReactChangeEvent<T>) => void;
  export type MouseEventHandler<T = Element> = (event: ReactMouseEvent<T>) => void;
}
