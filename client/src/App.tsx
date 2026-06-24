import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { LoadingScreen } from "./components/LoadingScreen";
import { AppShellLayout } from "./layout/AppShellLayout";
import { ProtectedRoute } from "./layout/ProtectedRoute";

const AuthPage = lazy(() => import("./pages/AuthPage").then((module) => ({ default: module.AuthPage })));
const BookmarksPage = lazy(() => import("./pages/BookmarksPage").then((module) => ({ default: module.BookmarksPage })));
const ComicDetailsPage = lazy(() =>
  import("./pages/ComicDetailsPage").then((module) => ({ default: module.ComicDetailsPage }))
);
const ComicEditorPage = lazy(() =>
  import("./pages/ComicEditorPage").then((module) => ({ default: module.ComicEditorPage }))
);
const DashboardPage = lazy(() => import("./pages/DashboardPage").then((module) => ({ default: module.DashboardPage })));
const HomePage = lazy(() => import("./pages/HomePage").then((module) => ({ default: module.HomePage })));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage").then((module) => ({ default: module.NotFoundPage })));
const ReaderPage = lazy(() => import("./pages/ReaderPage").then((module) => ({ default: module.ReaderPage })));

export function App() {
  return (
    <Suspense fallback={<LoadingScreen label="Загружаем раздел" />}>
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
    </Suspense>
  );
}
