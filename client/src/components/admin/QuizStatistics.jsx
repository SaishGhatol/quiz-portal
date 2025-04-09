import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';

const QuizStatistics = () => {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuizStatistics = async () => {
      try {
        setLoading(true);
        
        // Fetch quiz data
        const quizResponse = await api.get(`/quizzes/${id}`);
        setQuiz(quizResponse.data.quiz);
        
        // Fetch quiz statistics
        const statsResponse = await api.get(`/quizzes/${id}/statistics`);
        setStatistics(statsResponse.data.statistics);
        
        // Fetch recent attempts
        const attemptsResponse = await api.get(`/quizzes/${id}/attempts?limit=10`);
        setAttempts(attemptsResponse.data.attempts);
        
        setError(null);
      } catch (error) {
        console.error('Error fetching quiz statistics:', error);
        setError('Failed to load quiz statistics. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizStatistics();
  }, [id]);

  if (loading) {
    return <div className="text-center py-10">Loading statistics...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Statistics: {quiz?.title}</h1>
        <Link 
          to="/admin/quizzes" 
          className="bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded"
        >
          Back to Quizzes
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-2">Total Attempts</h3>
          <p className="text-3xl font-bold text-blue-600">{statistics?.totalAttempts || 0}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-2">Average Score</h3>
          <p className="text-3xl font-bold text-green-600">
            {statistics?.averageScore ? `${Math.round(statistics.averageScore)}%` : 'N/A'}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-2">Pass Rate</h3>
          <p className="text-3xl font-bold text-indigo-600">
            {statistics?.passRate ? `${Math.round(statistics.passRate)}%` : 'N/A'}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-2">Unique Users</h3>
          <p className="text-3xl font-bold text-purple-600">{statistics?.uniqueUsers || 0}</p>
        </div>
      </div>

      {/* Question Statistics */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Question Performance</h2>
        
        {statistics?.questionStats && statistics.questionStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correct Answers</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difficulty</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {statistics.questionStats.map((question, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{question.text}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{question.correctCount} / {question.totalAttempts}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        question.successRate >= 70 ? 'bg-green-100 text-green-800' : 
                        question.successRate >= 40 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {Math.round(question.successRate)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {question.successRate >= 70 ? 'Easy' : 
                         question.successRate >= 40 ? 'Medium' : 
                         'Hard'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-4">No question statistics available.</p>
        )}
      </div>

      {/* Recent Attempts */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Recent Attempts</h2>
        </div>
        
        {attempts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Taken</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attempts.map((attempt) => (
                  <tr key={attempt._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{attempt.user?.name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{attempt.user?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(attempt.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(attempt.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        attempt.score >= 70 ? 'bg-green-100 text-green-800' : 
                        attempt.score >= 40 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {attempt.score}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {attempt.timeTaken ? `${Math.floor(attempt.timeTaken / 60)}m ${attempt.timeTaken % 60}s` : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link 
                        to={`/attempts/${attempt._id}`}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-4">No attempts recorded yet.</p>
        )}
      </div>
    </div>
  );
};

export default QuizStatistics

