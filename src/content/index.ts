import type { Module } from './types';
import { foundations } from './modules/01-foundations';
import { narrowing } from './modules/02-narrowing';
import { generics } from './modules/03-generics';

/** Order here is the order on the picker, and the intended learning order. */
export const MODULES: Module[] = [
  foundations,
  narrowing,
  generics,
  {
    id: 'utility-types',
    title: 'Utility & Mapped Types',
    blurb: 'Partial, Pick, Omit, Record — and how to write your own with a mapped type.',
    status: 'planned',
    exercises: [],
  },
  {
    id: 'conditional-types',
    title: 'Conditional & Template Literal Types',
    blurb: 'infer, distributive conditionals, and building string types from other types.',
    status: 'planned',
    exercises: [],
  },
  {
    id: 'project-setup',
    title: 'Modules, Declaration Files & tsconfig',
    blurb: 'Module resolution, path aliases, .d.ts files, and typing an untyped npm package.',
    status: 'planned',
    exercises: [],
  },
  {
    id: 'backend-patterns',
    title: 'Backend Patterns',
    blurb: 'Handler signatures, runtime validation with zod, parsing env vars, Result types.',
    status: 'planned',
    exercises: [],
  },
  {
    id: 'react',
    title: 'Typing React',
    blurb: 'Props, hooks, event handlers, generic components, discriminated-union props.',
    status: 'planned',
    exercises: [],
  },
];

export function findModule(id: string): Module | undefined {
  return MODULES.find((m) => m.id === id);
}
