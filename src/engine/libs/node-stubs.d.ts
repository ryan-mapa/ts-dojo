// A curated slice of @types/node, hand-written so the in-browser TS worker stays
// fast. The real @types/node is hundreds of files and several megabytes, which
// would noticeably slow worker startup for the handful of APIs the backend
// exercises actually touch. If an exercise ever needs something beyond this,
// add it here rather than pulling in the full package.

interface ProcessEnv {
  [key: string]: string | undefined;
}

interface Process {
  env: ProcessEnv;
  argv: string[];
  cwd(): string;
  exit(code?: number): never;
  platform: string;
}

declare const process: Process;

declare module 'node:path' {
  export function join(...paths: string[]): string;
  export function resolve(...paths: string[]): string;
  export function basename(p: string, ext?: string): string;
  export function dirname(p: string): string;
  export function extname(p: string): string;
  export const sep: string;
}

declare module 'node:fs/promises' {
  export function readFile(path: string, encoding: 'utf8'): Promise<string>;
  export function readFile(path: string): Promise<Uint8Array>;
  export function writeFile(path: string, data: string): Promise<void>;
  export function mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  export function readdir(path: string): Promise<string[]>;
  export function rm(path: string, options?: { recursive?: boolean; force?: boolean }): Promise<void>;
}

declare module 'node:os' {
  export function homedir(): string;
  export function tmpdir(): string;
  export function platform(): string;
}
