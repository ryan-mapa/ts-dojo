import { Link } from 'react-router-dom';
import { MODULES } from '../content';
import { useProgress, keyOf } from '../store/progress';

export function ModulePicker() {
  const completed = useProgress((s) => s.completed);
  const reset = useProgress((s) => s.reset);

  const totalDone = MODULES.flatMap((m) => m.exercises.filter((e) => completed[keyOf(m.id, e.id)])).length;
  const totalExercises = MODULES.flatMap((m) => m.exercises).length;

  return (
    <main className="picker">
      <header className="masthead">
        <h1>ts&#8209;dojo</h1>
        <p className="tagline">
          Learn TypeScript by arguing with the compiler, not by reading about it. Every exercise is graded
          by a real type&nbsp;checker.
        </p>
        {totalExercises > 0 && (
          <p className="muted">
            {totalDone} of {totalExercises} solved
            {totalDone > 0 && (
              <>
                {' · '}
                <button className="link" onClick={reset}>
                  reset progress
                </button>
              </>
            )}
          </p>
        )}
      </header>

      <ul className="module-grid">
        {MODULES.map((m, i) => {
          const done = m.exercises.filter((e) => completed[keyOf(m.id, e.id)]).length;
          const ready = m.status === 'ready';
          return (
            <li key={m.id} className={ready ? 'module-card' : 'module-card planned'}>
              <span className="module-index">{String(i + 1).padStart(2, '0')}</span>
              <h2>{ready ? <Link to={`/module/${m.id}`}>{m.title}</Link> : m.title}</h2>
              <p>{m.blurb}</p>
              <p className="module-meta">
                {ready ? `${done} / ${m.exercises.length} solved` : 'Not written yet'}
              </p>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
