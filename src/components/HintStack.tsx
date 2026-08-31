import { useState } from 'react';
import { Inline } from './Markdown';

/**
 * Hints reveal one at a time, cheapest first. Revealing them one by one rather
 * than all at once is the point: the last hint is close to the answer, and
 * getting it for free the moment you're mildly stuck defeats the exercise.
 */
export function HintStack({ hints, onRevealSolution }: { hints: string[]; onRevealSolution: () => void }) {
  const [shown, setShown] = useState(0);

  return (
    <div className="hints">
      {hints.slice(0, shown).map((h, i) => (
        <p key={i} className="hint">
          <span className="hint-index">Hint {i + 1}</span> <Inline text={h} />
        </p>
      ))}
      {shown < hints.length ? (
        <button className="ghost" onClick={() => setShown((s) => s + 1)}>
          {shown === 0 ? 'Stuck? Show a hint' : `Show hint ${shown + 1} of ${hints.length}`}
        </button>
      ) : (
        <button className="ghost danger" onClick={onRevealSolution}>
          Show the solution
        </button>
      )}
    </div>
  );
}
