import { lazy, Suspense, useEffect, useLayoutEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
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
const ContactPage = lazy(() => import("./pages/ContactPage").then((module) => ({ default: module.ContactPage })));
const DashboardPage = lazy(() => import("./pages/DashboardPage").then((module) => ({ default: module.DashboardPage })));
const HelpPage = lazy(() => import("./pages/HelpPage").then((module) => ({ default: module.HelpPage })));
const HomePage = lazy(() => import("./pages/HomePage").then((module) => ({ default: module.HomePage })));
const LandingPage = lazy(() => import("./pages/LandingPage").then((module) => ({ default: module.LandingPage })));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage").then((module) => ({ default: module.NotFoundPage })));
const ReaderPage = lazy(() => import("./pages/ReaderPage").then((module) => ({ default: module.ReaderPage })));

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.key]);

  return null;
}

export function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<LoadingScreen label="Загружаем раздел" />}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<AppShellLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="catalog" element={<HomePage />} />
            <Route path="help" element={<HelpPage />} />
            <Route path="contacts" element={<ContactPage />} />
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
    </>
  );
}
