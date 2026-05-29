import { Route, Routes } from "react-router-dom";
import { AppShellLayout } from "./layout/AppShellLayout";
import { ProtectedRoute } from "./layout/ProtectedRoute";
import { AuthPage } from "./pages/AuthPage";
import { BookmarksPage } from "./pages/BookmarksPage";
import { ComicDetailsPage } from "./pages/ComicDetailsPage";
import { ComicEditorPage } from "./pages/ComicEditorPage";
import { DashboardPage } from "./pages/DashboardPage";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ReaderPage } from "./pages/ReaderPage";

export function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/" element={<AppShellLayout />}>
        <Route index element={<HomePage />} />
        <Route path="comics/:slug" element={<ComicDetailsPage />} />
        <Route path="read/:slug" element={<ReaderPage />} />
        <Route
          path="bookmarks"
          element={
            <ProtectedRoute>
              <BookmarksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="editor/new"
          element={
            <ProtectedRoute>
              <ComicEditorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="editor/:slug"
          element={
            <ProtectedRoute>
              <ComicEditorPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
