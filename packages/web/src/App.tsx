import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import { HomePage } from './pages/HomePage';
import { JoinPage } from './pages/JoinPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Phones only need the home and join pages; presenter screens load on demand.
const NewPresentationPage = lazy(() =>
  import('./pages/NewPresentationPage').then((m) => ({ default: m.NewPresentationPage })),
);
const EditorPage = lazy(() =>
  import('./pages/EditorPage').then((m) => ({ default: m.EditorPage })),
);
const PresentPage = lazy(() =>
  import('./pages/PresentPage').then((m) => ({ default: m.PresentPage })),
);

export function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/new" element={<NewPresentationPage />} />
        <Route path="/edit/:id" element={<EditorPage />} />
        <Route path="/present/:id" element={<PresentPage />} />
        <Route path="/join/:code" element={<JoinPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
