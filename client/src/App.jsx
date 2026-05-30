import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider }  from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { OrgProvider }   from './contexts/OrgContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layout
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer/Footer';
import TermsPage    from './components/layout/Footer/TermsPage';
import PrivacyPage  from './components/layout/Footer/PrivacyPage';
import ContactPage  from './components/layout/Footer/ContactPage';

// Public pages
import Home        from './components/Home';
import Leaderboard from './components/Leaderboard';
import Pricing     from './components/Pricing';

// Auth guards
import Login          from './components/auth/Login';
import Register       from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute     from './components/auth/AdminRoute';
import OrgAdminRoute  from './components/auth/OrgAdminRoute';

// User pages (any logged-in user)
import Dashboard      from './components/dashboard/Dashboard';
import Profile        from './components/profile/Profile';
import UserAttempts   from './components/profile/UserAttempts';
import AttemptDetail  from './components/profile/AttemptDetail';
import StudentProgress from './components/profile/StudentProgress';

// Quiz pages
import QuizList      from './components/quiz/QuizList';
import QuizDetail    from './components/quiz/QuizDetail';
import TakeQuiz      from './components/quiz/TakeQuiz';
import QuizResults   from './components/quiz/QuizResults';
import MyAssignments from './components/quiz/MyAssignments';

// Student class page (org members)
import MyClasses from './components/student/MyClasses';

// Platform admin pages
import AdminDashboard  from './components/admin/AdminDashboard';
import ManageQuizzes   from './components/admin/ManageQuizzes';
import CreateQuiz      from './components/admin/CreateQuiz';
import EditQuiz        from './components/admin/EditQuiz';
import ManageQuestions from './components/admin/ManageQuestions';
import ManageUsers     from './components/admin/ManageUsers';
import QuizStatistics  from './components/admin/QuizStatistics';

// Organisation admin pages
import OrgSetup       from './components/org/OrgSetup';
import OrgDashboard   from './components/org/OrgDashboard';
import ManageBatches  from './components/org/ManageBatches';
import BatchDetail    from './components/org/BatchDetail';
import ManageStudents from './components/org/ManageStudents';
import Assignments    from './components/org/Assignments';
import OrgAnalytics   from './components/org/OrgAnalytics';
import Announcements  from './components/org/Announcements';
import JoinOrg        from './components/org/JoinOrg';

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <OrgProvider>
        <Router>
          <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
            <Navbar />
            <main className="flex-1 w-full pt-16">
              <Routes>

                {/* ── Public ─────────────────────────────────────────────── */}
                <Route path="/"            element={<Home />} />
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
                  <Route path="/dashboard"               element={<Dashboard />} />
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
                </Route>

                {/* ── Platform admin + org admin (quiz CRUD) ──────────────── */}
                <Route element={<AdminRoute />}>
                  <Route path="/admin"                        element={<AdminDashboard />} />
                  <Route path="/admin/quizzes"                element={<ManageQuizzes />} />
                  <Route path="/admin/quizzes/create"         element={<CreateQuiz />} />
                  <Route path="/admin/quizzes/:id/edit"       element={<EditQuiz />} />
                  <Route path="/admin/quizzes/:id/questions"  element={<ManageQuestions />} />
                  <Route path="/admin/quizzes/:id/statistics" element={<QuizStatistics />} />
                  <Route path="/admin/users"                  element={<ManageUsers />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>

          <ToastContainer
            position="top-right"
            autoClose={3000}
            theme="colored"
            toastClassName="!rounded-xl !text-sm !font-medium"
          />
        </Router>
      </OrgProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
