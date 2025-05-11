import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const ManageQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/quizzes/recent');
      
      // Fetch question counts for each quiz
      const quizzesWithQuestions = await Promise.all(
        response.data.quizzes.map(async (quiz) => {
          try {
            const questionsRes = await api.get(`/quizzes/${quiz._id}/questions`);
            return {
              ...quiz,
              questionCount: questionsRes.data.questions.length
            };
          } catch (err) {
            console.error(`Error fetching questions for quiz ${quiz._id}:`, err);
            return {
              ...quiz,
              questionCount: 0
            };
          }
        })
      );
      
      setQuizzes(quizzesWithQuestions);
      setError(null);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      setError('Failed to load quizzes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deleteQuiz = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;
    
    try {
      await api.delete(`/quizzes/${quizId}`);
      toast.success('Quiz deleted successfully');
      setQuizzes(quizzes.filter(quiz => quiz._id !== quizId));
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast.error('Failed to delete quiz');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4 text-center">
        <div className="flex flex-col items-center justify-center bg-white rounded-lg shadow-md p-8">
          <svg className="animate-spin h-12 w-12 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg text-gray-600">Loading quizzes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 shadow-md">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Quizzes</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchQuizzes} 
            className="px-5 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-150 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Manage Quizzes</h1>
          <p className="text-gray-600">Create, edit and manage your quizzes</p>
        </div>
        <Link 
          to="/admin/quizzes/create" 
          className="mt-4 md:mt-0 inline-flex items-center px-5 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition duration-150 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Create New Quiz
        </Link>
      </div>

      {quizzes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md border border-gray-100 p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-50 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Quizzes Yet</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">Get started by creating your first quiz and engage your audience with interactive content!</p>
          <Link 
            to="/admin/quizzes/create" 
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-150 shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Create First Quiz
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <p className="text-gray-700 font-medium">{quizzes.length} {quizzes.length === 1 ? 'quiz' : 'quizzes'} available</p>
              <div className="flex space-x-2">
                {/* Additional filter/sort options could go here */}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Questions</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {quizzes.map(quiz => (
                  <tr key={quiz._id} className="hover:bg-gray-50 transition duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{quiz.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 truncate max-w-xs">{quiz.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mr-2">
                          <span className="text-sm font-semibold text-blue-800">{quiz.questionCount}</span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {quiz.questionCount === 1 ? 'question' : 'questions'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex items-center text-xs font-medium rounded-full ${
                        quiz.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {quiz.isPublished ? (
                          <>
                            <span className="w-2 h-2 bg-green-600 rounded-full mr-1"></span>
                            Published
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 bg-yellow-600 rounded-full mr-1"></span>
                            Draft
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <Link 
                          to={`/admin/quizzes/${quiz._id}/edit`} 
                          className="text-indigo-600 hover:text-indigo-900 flex items-center hover:bg-indigo-50 px-2 py-1 rounded transition-colors"
                          title="Edit Quiz"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </Link>
                        <Link 
                          to={`/admin/quizzes/${quiz._id}/questions`} 
                          className="text-blue-600 hover:text-blue-900 flex items-center hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                          title="Manage Questions"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Questions
                        </Link>
                        <Link 
                          to={`/admin/quizzes/${quiz._id}/statistics`} 
                          className="text-green-600 hover:text-green-900 flex items-center hover:bg-green-50 px-2 py-1 rounded transition-colors"
                          title="View Statistics"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Stats
                        </Link>
                        <button 
                          onClick={() => deleteQuiz(quiz._id)} 
                          className="text-red-600 hover:text-red-900 flex items-center hover:bg-red-50 px-2 py-1 rounded transition-colors"
                          title="Delete Quiz"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageQuizzes;