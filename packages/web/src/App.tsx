import { Route, Routes } from 'react-router';
import { EditorPage } from './pages/EditorPage';
import { HomePage } from './pages/HomePage';
import { JoinPage } from './pages/JoinPage';
import { NewPresentationPage } from './pages/NewPresentationPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PresentPage } from './pages/PresentPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/new" element={<NewPresentationPage />} />
      <Route path="/edit/:id" element={<EditorPage />} />
      <Route path="/present/:id" element={<PresentPage />} />
      <Route path="/join/:code" element={<JoinPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
