import { createHashRouter, RouterProvider } from 'react-router-dom';
import { ModulePicker } from './routes/ModulePicker';
import { ExerciseView } from './routes/ExerciseView';

// Hash routing on purpose: GitHub Pages has no server-side rewrite, so a deep
// link like /module/foundations would 404 on refresh under BrowserRouter. The
// usual workaround is a copied 404.html; a hash router just makes the problem
// not exist.
const router = createHashRouter([
  { path: '/', element: <ModulePicker /> },
  { path: '/module/:moduleId', element: <ExerciseView /> },
  { path: '/module/:moduleId/:exerciseId', element: <ExerciseView /> },
  { path: '*', element: <ModulePicker /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
