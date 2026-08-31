import type { Module } from './types';
import { foundations } from './modules/01-foundations';
import { narrowing } from './modules/02-narrowing';
import { generics } from './modules/03-generics';
import { utilityTypes } from './modules/04-utility-types';
import { conditionalTypes } from './modules/05-conditional-types';
import { declarationFiles } from './modules/06-declaration-files';
import { backendPatterns } from './modules/07-backend-patterns';
import { react } from './modules/08-react';

/** Order here is the order on the picker, and the intended learning order. */
export const MODULES: Module[] = [
  foundations,
  narrowing,
  generics,
  utilityTypes,
  conditionalTypes,
  declarationFiles,
  backendPatterns,
  react,
];

export function findModule(id: string): Module | undefined {
  return MODULES.find((m) => m.id === id);
}

/**
 * 1-based position in MODULES. Derived rather than stored on the module, so the
 * array order stays the single source of truth for the learning sequence —
 * a stored number would be a second copy to keep in step, which is the exact
 * thing module 1 exercise 5 argues against.
 */
export function moduleNumber(id: string): number {
  return MODULES.findIndex((m) => m.id === id) + 1;
}
