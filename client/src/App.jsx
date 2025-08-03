// src/App.js
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
          <main className="flex-grow container mx-auto px-4 py-6 pt-16">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/quizzes" element={<QuizList />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<div className="container mx-auto px-4 py-6"><Dashboard /></div>} />
                <Route path="/profile" element={<div className="container mx-auto px-4 py-6"><Profile /></div>} />
                <Route path="/my-attempts" element={<div className="container mx-auto px-4 py-6"><UserAttempts /></div>} />
                <Route path="/attempts/:id" element={<div className="container mx-auto px-4 py-6"><AttemptDetail /></div>} />
                <Route path="/quiz/:id" element={<div className="container mx-auto px-4 py-6"><QuizDetail /></div>} />
                <Route path="/quiz/:id/take" element={<div className="container mx-auto px-4 py-6"><TakeQuiz /></div>} />
                <Route path="/quiz/results/:attemptId" element={<div className="container mx-auto px-4 py-6"><QuizResults /></div>} />
              </Route>
              
              {/* Admin Routes */}
               <Route element={<AdminRoute />}>
                <Route path="/admin" element={<div className="container mx-auto px-4 py-6"><AdminDashboard /></div>} />
                <Route path="/admin/quizzes" element={<div className="container mx-auto px-4 py-6"><ManageQuizzes /></div>} />
                <Route path="/admin/quizzes/create" element={<div className="container mx-auto px-4 py-6"><CreateQuiz /></div>} />
                <Route path="/admin/quizzes/:id/edit" element={<div className="container mx-auto px-4 py-6"><EditQuiz /></div>} />
                <Route path="/admin/quizzes/:id/questions" element={<div className="container mx-auto px-4 py-6"><ManageQuestions /></div>} />
                <Route path="/admin/quizzes/:id/statistics" element={<div className="container mx-auto px-4 py-6"><QuizStatistics /></div>} />
                <Route path="/admin/users" element={<div className="container mx-auto px-4 py-6"><ManageUsers /></div>} />
              </Route> 
              
              <Route path="/terms" element={<div className="container mx-auto px-4 py-6"><TermsPage /></div>} />
            <Route path="/privacy" element={<div className="container mx-auto px-4 py-6"><PrivacyPage /></div>} />
            <Route path="/contact" element={<div className="container mx-auto px-4 py-6"><ContactPage /></div>} />
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