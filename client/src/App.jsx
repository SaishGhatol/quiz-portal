import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import QuizList from './pages/QuizList';
import QuizDetails from './pages/QuizDetails';
import TakeQuiz from './pages/TakeQuiz';
import QuizResults from './pages/QuizResults';
import QuizHistory from './pages/QuizHistory';
import NotFound from './pages/NotFound';

// Admin pages
import ManageQuizzes from './pages/admin/ManageQuizzes';
import CreateQuiz from './pages/admin/CreateQuiz';
import EditQuiz from './pages/admin/EditQuiz';
import ManageUsers from './pages/admin/ManageUsers';

// Components
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';

const App = () => {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Layout>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected user routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/quizzes" element={
                <ProtectedRoute>
                  <QuizList />
                </ProtectedRoute>
              } />
              <Route path="/quiz/:id" element={
                <ProtectedRoute>
                  <QuizDetails />
                </ProtectedRoute>
              } />
              <Route path="/quiz/:id/take" element={
                <ProtectedRoute>
                  <TakeQuiz />
                </ProtectedRoute>
              } />
              <Route path="/quiz/:id/results/:attemptId" element={
                <ProtectedRoute>
                  <QuizResults />
                </ProtectedRoute>
              } />
              <Route path="/history" element={
                <ProtectedRoute>
                  <QuizHistory />
                </ProtectedRoute>
              } />
              
              {/* Admin routes */}
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } />
              <Route path="/admin/quizzes" element={
                <AdminRoute>
                  <ManageQuizzes />
                </AdminRoute>
              } />
              <Route path="/admin/quizzes/create" element={
                <AdminRoute>
                  <CreateQuiz />
                </AdminRoute>
              } />
              <Route path="/admin/quizzes/edit/:id" element={
                <AdminRoute>
                  <EditQuiz />
                </AdminRoute>
              } />
              <Route path="/admin/users" element={
                <AdminRoute>
                  <ManageUsers />
                </AdminRoute>
              } />
              
              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
              