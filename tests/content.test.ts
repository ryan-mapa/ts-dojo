import { describe, it, expect } from 'vitest';
import { MODULES } from '../src/content';
import { checkExercise, checkSnippet, fences, formatDiagnostics } from './tsCheck';

const ready = MODULES.filter((m) => m.status === 'ready');

describe.each(ready)('$title', (module) => {
  it('is marked ready, so it must have exercises', () => {
    expect(module.exercises.length).toBeGreaterThan(0);
  });

  describe.each(module.exercises)('$title', (ex) => {
    it('accepts the solution', () => {
      const diags = checkExercise(ex.solution, ex.hiddenChecks, ex.fileName);
      expect(formatDiagnostics(diags)).toBe('');
    });

    // The assertion that actually earns its keep. An exercise whose starter code
    // already satisfies the checks is worse than a missing exercise: it marks
    // itself complete the moment you open it, and you learn nothing.
    it('rejects the starter code', () => {
      const diags = checkExercise(ex.starterCode, ex.hiddenChecks, ex.fileName);
      expect(diags.length).toBeGreaterThan(0);
    });

    it('has hints that build toward the answer', () => {
      expect(ex.hints.length).toBeGreaterThanOrEqual(2);
    });

    // Teaching examples are held to the same standard as the exercises: a
    // ```ts block must compile, and a ```ts-bad block must not. An example that
    // silently stopped being true would teach the wrong thing with the full
    // authority of appearing in the lesson.
    const blocks = [...fences(ex.concept ?? ''), ...fences(ex.debrief ?? '')];
    const checked = blocks.filter((b) => /^tsx?(-bad)?$/.test(b.lang));

    checked.forEach((block, i) => {
      it(`example ${i + 1} (${block.lang}) says what it claims`, () => {
        const diags = checkSnippet(block.code, block.lang.startsWith('tsx'));
        if (!block.lang.endsWith('-bad')) {
          expect(formatDiagnostics(diags)).toBe('');
        } else {
          expect(diags.length).toBeGreaterThan(0);
        }
      });
    });
  });
});

it('has no duplicate exercise ids', () => {
  const ids = MODULES.flatMap((m) => m.exercises.map((e) => `${m.id}/${e.id}`));
  expect(new Set(ids).size).toBe(ids.length);
});
