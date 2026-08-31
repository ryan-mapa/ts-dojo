import { Link } from 'react-router-dom';
import { MODULES } from '../content';
import { Inline } from '../components/Markdown';
import { Logo } from '../components/Logo';
import { useProgress, keyOf } from '../store/progress';

export function ModulePicker() {
  const completed = useProgress((s) => s.completed);
  const reset = useProgress((s) => s.reset);

  const totalDone = MODULES.flatMap((m) => m.exercises.filter((e) => completed[keyOf(m.id, e.id)])).length;
  const totalExercises = MODULES.flatMap((m) => m.exercises).length;

  return (
    <main className="picker">
      <header className="masthead">
        <h1>
          <Logo />
        </h1>
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
              <p className="module-number">Module {String(i + 1).padStart(2, '0')}</p>
              <h2>{ready ? <Link to={`/module/${m.id}`}>{m.title}</Link> : m.title}</h2>
              <p>
                <Inline text={m.blurb} />
              </p>
              <p className="module-meta">
                {ready ? `${done} / ${m.exercises.length} solved` : 'Not written yet'}
              </p>
            </li>
          );
        })}
      </ul>

      <footer className="site-footer">
        <a href="https://github.com/ryan-mapa/ts-dojo" target="_blank" rel="noopener noreferrer">
          Source on GitHub
        </a>
        <span className="sep">·</span>
        <span>graded in your browser by TypeScript 5.9</span>
      </footer>
    </main>
  );
}
