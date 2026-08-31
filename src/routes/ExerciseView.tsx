import { useCallback, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { findModule } from '../content';
import { Markdown } from '../components/Markdown';
import { HintStack } from '../components/HintStack';
import { ExerciseEditor } from '../components/ExerciseEditor';
import { useProgress, keyOf } from '../store/progress';

export function ExerciseView() {
  const { moduleId = '', exerciseId } = useParams();
  const navigate = useNavigate();
  const mod = findModule(moduleId);

  const drafts = useProgress((s) => s.drafts);
  const completed = useProgress((s) => s.completed);
  const saveDraft = useProgress((s) => s.saveDraft);
  const markComplete = useProgress((s) => s.markComplete);

  const index = mod?.exercises.findIndex((e) => e.id === exerciseId) ?? -1;
  const exercise = index >= 0 ? mod!.exercises[index] : undefined;
  const key = exercise ? keyOf(moduleId, exercise.id) : '';

  // Read the draft once per exercise. Reading it on every render would feed the
  // editor its own output and fight the user's cursor.
  const initialCode = useMemo(
    () => drafts[key] ?? exercise?.starterCode ?? '',
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );

  // Bumping this is how the left-hand hint panel tells the editor (which owns
  // the Monaco model) to overwrite its contents with the solution.
  const [revealSignal, setRevealSignal] = useState(0);

  const onPass = useCallback(() => markComplete(key), [markComplete, key]);
  const onCodeChange = useCallback((code: string) => saveDraft(key, code), [saveDraft, key]);

  if (!mod) return <Navigate to="/" replace />;
  if (!exercise) {
    const first = mod.exercises[0];
    return first ? <Navigate to={`/module/${moduleId}/${first.id}`} replace /> : <Navigate to="/" replace />;
  }

  const next = mod.exercises[index + 1];

  return (
    <main className="exercise">
      <nav className="crumbs">
        <Link to="/">All modules</Link>
        <span>/</span>
        <span>{mod.title}</span>
      </nav>

      <div className="exercise-body">
        <section className="panel">
          <p className="eyebrow">
            Exercise {index + 1} of {mod.exercises.length}
            {completed[key] && <span className="badge">solved</span>}
          </p>
          <h1>{exercise.title}</h1>
          {exercise.concept && (
            <section className="reading">
              <h2 className="section-label">The concept</h2>
              <Markdown markdown={exercise.concept} />
            </section>
          )}

          <section className="reading task">
            <h2 className="section-label">Your task</h2>
            <Markdown markdown={exercise.brief} />
          </section>
          <HintStack
            key={exercise.id}
            hints={exercise.hints}
            onRevealSolution={() => setRevealSignal((n) => n + 1)}
          />

          {exercise.debrief && completed[key] && (
            <section className="reading debrief">
              <h2 className="section-label">Going deeper</h2>
              <Markdown markdown={exercise.debrief} />
            </section>
          )}

          <div className="exercise-nav">
            {mod.exercises.map((e, i) => (
              <Link
                key={e.id}
                to={`/module/${moduleId}/${e.id}`}
                className={
                  e.id === exercise.id ? 'pip current' : completed[keyOf(moduleId, e.id)] ? 'pip done' : 'pip'
                }
                title={e.title}
              >
                {i + 1}
              </Link>
            ))}
          </div>
        </section>

        <ExerciseEditor
          key={exercise.id}
          exercise={exercise}
          initialCode={initialCode}
          onCodeChange={onCodeChange}
          onPass={onPass}
          revealSignal={revealSignal}
        />
      </div>

      {completed[key] && next && (
        <button className="primary next" onClick={() => navigate(`/module/${moduleId}/${next.id}`)}>
          Next: {next.title} →
        </button>
      )}
    </main>
  );
}
