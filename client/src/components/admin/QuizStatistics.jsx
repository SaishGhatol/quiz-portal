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
        console.log('Fetching quiz with ID:', id);

        const quizRes = await api.get(`/quizzes/${id}`);
        setQuiz(quizRes.data?.quiz);

        const statsRes = await api.get(`/quizzes/${id}/statistics`);
        setStatistics(statsRes.data?.statistics);

        const attemptsRes = await api.get(`/quizzes/${id}/attempts?limit=10`);
        setAttempts(attemptsRes.data?.attempts || []);
        
        setError(null);
      } catch (error) {
        console.error('Error fetching stats:', error.response?.data || error.message);
        setError('Failed to load quiz statistics. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizStatistics();
  }, [id]);

  if (loading) return <div className="text-center py-10">Loading statistics...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Statistics: {quiz?.title || 'Quiz'}</h1>
        <Link 
          to="/admin/quizzes" 
          className="bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded"
        >
          Back to Quizzes
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Total Attempts", value: statistics?.totalAttempts || 0, color: "text-blue-600" },
          { label: "Average Score", value: statistics?.averageScore !== undefined ? `${Math.round(statistics.averageScore)}%` : "N/A", color: "text-green-600" },
          { label: "Pass Rate", value: statistics?.passRate !== undefined ? `${Math.round(statistics.passRate)}%` : "N/A", color: "text-indigo-600" },
          { label: "Unique Users", value: statistics?.uniqueUsers || 0, color: "text-purple-600" },
        ].map((item, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-2">{item.label}</h3>
            <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Question Performance */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Question Performance</h2>
        {statistics?.questionStats?.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["Question", "Correct Answers", "Success Rate", "Difficulty"].map((head, i) => (
                    <th key={i} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {statistics.questionStats.map((q, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 text-sm text-gray-900">{q.text}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{q.correctCount} / {q.totalAttempts}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${
                        q.successRate >= 70 ? 'bg-green-100 text-green-800' :
                        q.successRate >= 40 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {Math.round(q.successRate)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {q.successRate >= 70 ? 'Easy' : q.successRate >= 40 ? 'Medium' : 'Hard'}
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
        {attempts.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["User", "Date", "Score", "Time Taken", "Action"].map((head, i) => (
                    <th key={i} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attempts.map((attempt) => (
                  <tr key={attempt._id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{attempt.user?.name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{attempt.user?.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {new Date(attempt.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(attempt.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${
                        attempt.score >= 70 ? 'bg-green-100 text-green-800' :
                        attempt.score >= 40 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {attempt.score}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {attempt.timeTaken ? `${Math.floor(attempt.timeTaken / 60)}m ${attempt.timeTaken % 60}s` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-500">
                      <Link to={`/attempts/${attempt._id}`} className="hover:text-blue-700">View Details</Link>
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

export default QuizStatistics;

