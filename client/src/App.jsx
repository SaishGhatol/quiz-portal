// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layout components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Auth components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';

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
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow container mx-auto px-4 py-6">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<QuizList />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/my-attempts" element={<UserAttempts />} />
                <Route path="/attempts/:id" element={<AttemptDetail />} />
                <Route path="/quiz/:id" element={<QuizDetail />} />
                <Route path="/quiz/:id/take" element={<TakeQuiz />} />
                <Route path="/quiz/results/:attemptId" element={<QuizResults />} />
              </Route>
              
              {/* Admin Routes */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/quizzes" element={<ManageQuizzes />} />
                <Route path="/admin/quizzes/create" element={<CreateQuiz />} />
                <Route path="/admin/quizzes/:id/edit" element={<EditQuiz />} />
                <Route path="/admin/quizzes/:id/questions" element={<ManageQuestions />} />
                <Route path="/admin/quizzes/:id/statistics" element={<QuizStatistics />} />
                <Route path="/admin/users" element={<ManageUsers />} />
              </Route>
              
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
      <ToastContainer position="top-right" autoClose={3000} />
    </AuthProvider>
  );
};

export default App;