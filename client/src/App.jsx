import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider }  from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { OrgProvider }   from './contexts/OrgContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Always loaded: chrome, guards and the error/loading shells
import Navbar        from './components/layout/Navbar';
import Footer        from './components/layout/Footer/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import RouteFallback from './components/RouteFallback';
import useRouteChrome from './utils/useRouteChrome';

import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute     from './components/auth/AdminRoute';
import PlatformAdminRoute from './components/auth/PlatformAdminRoute';
import OrgAdminRoute  from './components/auth/OrgAdminRoute';
import { LandingRoute, StudentOnlyRoute } from './components/auth/RoleRedirect';

// Every page is split into its own chunk so first load stays small
const Home        = lazy(() => import('./components/Home'));
const Leaderboard = lazy(() => import('./components/Leaderboard'));
const Pricing     = lazy(() => import('./components/Pricing'));
const NotFound    = lazy(() => import('./components/NotFound'));

const TermsPage   = lazy(() => import('./components/layout/Footer/TermsPage'));
const PrivacyPage = lazy(() => import('./components/layout/Footer/PrivacyPage'));
const ContactPage = lazy(() => import('./components/layout/Footer/ContactPage'));

const Login    = lazy(() => import('./components/auth/Login'));
const Register = lazy(() => import('./components/auth/Register'));

const Dashboard       = lazy(() => import('./components/dashboard/Dashboard'));
const Profile         = lazy(() => import('./components/profile/Profile'));
const UserAttempts    = lazy(() => import('./components/profile/UserAttempts'));
const AttemptDetail   = lazy(() => import('./components/profile/AttemptDetail'));
const StudentProgress = lazy(() => import('./components/profile/StudentProgress'));

const QuizList      = lazy(() => import('./components/quiz/QuizList'));
const QuizDetail    = lazy(() => import('./components/quiz/QuizDetail'));
const TakeQuiz      = lazy(() => import('./components/quiz/TakeQuiz'));
const QuizResults   = lazy(() => import('./components/quiz/QuizResults'));
const MyAssignments = lazy(() => import('./components/quiz/MyAssignments'));

const MyClasses = lazy(() => import('./components/student/MyClasses'));
const Practice  = lazy(() => import('./components/practice/Practice'));
const Mistakes  = lazy(() => import('./components/practice/Mistakes'));

const AdminDashboard  = lazy(() => import('./components/admin/AdminDashboard'));
const ManageQuizzes   = lazy(() => import('./components/admin/ManageQuizzes'));
const CreateQuiz      = lazy(() => import('./components/admin/CreateQuiz'));
const EditQuiz        = lazy(() => import('./components/admin/EditQuiz'));
const ManageQuestions = lazy(() => import('./components/admin/ManageQuestions'));
const ManageUsers     = lazy(() => import('./components/admin/ManageUsers'));
const QuizStatistics  = lazy(() => import('./components/admin/QuizStatistics'));
const ManageReviews   = lazy(() => import('./components/admin/ManageReviews'));
const AdminAnalytics  = lazy(() => import('./components/admin/AdminAnalytics'));
const AdminReports    = lazy(() => import('./components/admin/AdminReports'));

const OrgSetup       = lazy(() => import('./components/org/OrgSetup'));
const OrgDashboard   = lazy(() => import('./components/org/OrgDashboard'));
const Billing        = lazy(() => import('./components/org/Billing'));
const ManageBatches  = lazy(() => import('./components/org/ManageBatches'));
const BatchDetail    = lazy(() => import('./components/org/BatchDetail'));
const ManageStudents = lazy(() => import('./components/org/ManageStudents'));
const Assignments    = lazy(() => import('./components/org/Assignments'));
const OrgAnalytics   = lazy(() => import('./components/org/OrgAnalytics'));
const Announcements  = lazy(() => import('./components/org/Announcements'));
const JoinOrg        = lazy(() => import('./components/org/JoinOrg'));

// Taking a quiz is full-screen work, so the footer would only be in the way
const CHROMELESS = ['/take'];

const AppShell = () => {
  useRouteChrome();
  const { pathname } = useLocation();
  const hideFooter = CHROMELESS.some(s => pathname.endsWith(s));

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Lets keyboard users jump past the nav */}
      <a href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[80] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-brand-600 focus:text-white focus:text-sm focus:font-semibold">
        Skip to main content
      </a>

      <Navbar />

      <main id="main-content" className="flex-1 w-full pt-16">
        <ErrorBoundary key={pathname}>
          <Suspense fallback={<RouteFallback />}>
            <Routes>

              {/* ── Public ─────────────────────────────────────────────── */}
              <Route path="/"            element={<LandingRoute><Home /></LandingRoute>} />
              <Route path="/quizzes"     element={<QuizList />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/pricing"     element={<Pricing />} />
              <Route path="/login"       element={<Login />} />
              <Route path="/register"    element={<Register />} />
              <Route path="/terms"       element={<TermsPage />} />
              <Route path="/privacy"     element={<PrivacyPage />} />
              <Route path="/contact"     element={<ContactPage />} />

              {/* ── Any authenticated user ──────────────────────────────── */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard"               element={<StudentOnlyRoute><Dashboard /></StudentOnlyRoute>} />
                <Route path="/profile"                 element={<Profile />} />
                <Route path="/my-attempts"             element={<UserAttempts />} />
                <Route path="/progress"                element={<StudentProgress />} />
                <Route path="/attempts/:id"            element={<AttemptDetail />} />

                {/* Quiz routes — must list /quiz/results/:id BEFORE /quiz/:id */}
                <Route path="/quiz/results/:attemptId" element={<QuizResults />} />
                <Route path="/quiz/:id"                element={<QuizDetail />} />
                <Route path="/quiz/:id/take"           element={<TakeQuiz />} />

                {/* Org member routes (students + org admins) */}
                <Route path="/org/join"          element={<JoinOrg />} />
                <Route path="/org/setup"         element={<OrgSetup />} />
                <Route path="/my-assignments"    element={<MyAssignments />} />
                <Route path="/my-classes"        element={<MyClasses />} />
                <Route path="/practice/:id"      element={<Practice />} />
                <Route path="/mistakes"          element={<Mistakes />} />
              </Route>

              {/* ── Organisation admin ──────────────────────────────────── */}
              <Route element={<OrgAdminRoute />}>
                <Route path="/org"               element={<OrgDashboard />} />
                <Route path="/org/batches"       element={<ManageBatches />} />
                <Route path="/org/batches/:id"   element={<BatchDetail />} />
                <Route path="/org/students"      element={<ManageStudents />} />
                <Route path="/org/assignments"   element={<Assignments />} />
                <Route path="/org/analytics"     element={<OrgAnalytics />} />
                <Route path="/org/announcements" element={<Announcements />} />
                <Route path="/org/billing"       element={<Billing />} />
              </Route>

              {/* ── Platform admin + org admin (quiz CRUD) ──────────────── */}
              <Route element={<AdminRoute />}>
                <Route path="/admin"                        element={<AdminDashboard />} />
                <Route path="/admin/quizzes"                element={<ManageQuizzes />} />
                <Route path="/admin/quizzes/create"         element={<CreateQuiz />} />
                <Route path="/admin/quizzes/:id/edit"       element={<EditQuiz />} />
                <Route path="/admin/quizzes/:id/questions"  element={<ManageQuestions />} />
                <Route path="/admin/quizzes/:id/statistics" element={<QuizStatistics />} />
              </Route>

              {/* ── Platform admin only ─────────────────────────────────── */}
              <Route element={<PlatformAdminRoute />}>
                <Route path="/admin/users"                  element={<ManageUsers />} />
                <Route path="/admin/reviews"                element={<ManageReviews />} />
                <Route path="/admin/analytics"              element={<AdminAnalytics />} />
                <Route path="/admin/reports"                element={<AdminReports />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      {!hideFooter && <Footer />}
    </div>
  );
};

// Toasts follow the app theme instead of react-toastify's saturated "colored" palette
const Toasts = () => {
  const { isDark } = useTheme();
  return (
    <ToastContainer
      position="top-right"
      autoClose={3000}
      theme={isDark ? 'dark' : 'light'}
      newestOnTop
      limit={3}
      toastClassName="!rounded-xl !text-sm !font-medium"
    />
  );
};

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <OrgProvider>
        <Router>
          <AppShell />

          <Toasts />
        </Router>
      </OrgProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
