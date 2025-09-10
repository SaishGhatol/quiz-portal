import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layout components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer/Footer';
import TermsPage from './components/layout/Footer/TermsPage';
import PrivacyPage from './components/layout/Footer/PrivacyPage';
import ContactPage from './components/layout/Footer/ContactPage';
import Home from './components/Home';

// Auth components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
// import AuthCallback from './components/auth/AuthCallback'; // Ensure this is imported

// User components
import Dashboard from './components/dashboard/Dashboard';
import Profile from './components/profile/Profile';
import UserAttempts from './components/profile/UserAttempts';
import AttemptDetail from './components/profile/AttemptDetail';

// Quiz components
import QuizList from './components/quiz/QuizList';
import QuizDetail from './components/quiz/QuizDetail';
import TakeQuiz from './components/quiz/TakeQuiz';
import QuizResults from './components/quiz/QuizResults';

// Admin components
import AdminDashboard from './components/admin/AdminDashboard';
import ManageQuizzes from './components/admin/ManageQuizzes';
import CreateQuiz from './components/admin/CreateQuiz';
import EditQuiz from './components/admin/EditQuiz';
import ManageQuestions from './components/admin/ManageQuestions';
import ManageUsers from './components/admin/ManageUsers';
import QuizStatistics from './components/admin/QuizStatistics';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        {/* ENHANCED: Main container with a sophisticated dark theme and aurora background */}
        <div className="flex flex-col min-h-screen bg-black text-gray-300 relative overflow-x-hidden">
          {/* Animated Aurora Background */}
          <div className="absolute top-0 left-0 w-full h-full z-0 opacity-20">
            <div className="absolute top-0 left-[-20%] h-96 w-96 bg-[radial-gradient(circle_at_center,_rgba(148,163,184,0.5)_0,_transparent_50%)] animate-[spin_30s_linear_infinite]"></div>
            <div className="absolute bottom-0 right-[-20%] h-96 w-96 bg-[radial-gradient(circle_at_center,_rgba(148,163,184,0.5)_0,_transparent_50%)] animate-[spin_30s_linear_infinite_reverse]"></div>
          </div>
          
          <div className="relative z-10 flex flex-col min-h-screen">
            <Navbar />
            {/* ENHANCED: Streamlined main content area with fade-in animation */}
            <main className="flex-grow container mx-auto px-4 py-8 pt-24 animate-fade-in">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/quizzes" element={<QuizList />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                {/* <Route path="/auth/callback" element={<AuthCallback />} /> */}
                
                {/* Protected Routes - Redundant container divs removed */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/my-attempts" element={<UserAttempts />} />
                  <Route path="/attempts/:id" element={<AttemptDetail />} />
                  <Route path="/quiz/:id" element={<QuizDetail />} />
                  <Route path="/quiz/:id/take" element={<TakeQuiz />} />
                  <Route path="/quiz/results/:attemptId" element={<QuizResults />} />
                </Route>
                
                {/* Admin Routes - Redundant container divs removed */}
                 <Route element={<AdminRoute />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/quizzes" element={<ManageQuizzes />} />
                  <Route path="/admin/quizzes/create" element={<CreateQuiz />} />
                  <Route path="/admin/quizzes/:id/edit" element={<EditQuiz />} />
                  <Route path="/admin/quizzes/:id/questions" element={<ManageQuestions />} />
                  <Route path="/admin/quizzes/:id/statistics" element={<QuizStatistics />} />
                  <Route path="/admin/users" element={<ManageUsers />} />
                </Route> 
                
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </div>
      </Router>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      {/* CSS for fade-in animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </AuthProvider>
  );
};

export default App;
