import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { Line, Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import { Loader } from 'lucide-react';

// Custom hook for fetching all quiz data
const useQuizData = (quiz) => {
  const [state, setState] = useState({
    quiz: null,
    statistics: null,
    attempts: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchQuizStatistics = async () => {
      try {
        setState(prev => ({ ...prev, loading: true }));
        
        // Fetch all data in parallel for better performance
        const [quizRes, statsRes, attemptsRes] = await Promise.all([
          api.get(`/quizzes/${quiz}`),
          api.get(`/quizzes/${quiz}/statistics`),
          api.get(`/quizzes/${quiz}/attempts?limit=10`)
        ]);
        
        setState({
          quiz: quizRes.data.quiz,
          statistics: statsRes.data.statistics,
          attempts: attemptsRes.data.attempts || [],
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error fetching stats:', error.response?.data || error.message);
        setState({
          quiz: null,
          statistics: null,
          attempts: [],
          loading: false,
          error: 'Failed to load quiz statistics. Please try again.'
        });
      }
    };

    if (quiz) {
      fetchQuizStatistics();
    }
  }, [quiz]);

  return state;
};

const QuizStatistics = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { quiz, statistics, attempts, loading, error } = useQuizData(id);
  const [activeTab, setActiveTab] = useState('summary');

  // Calculate additional metrics
  const aggregateData = useMemo(() => {
    if (!statistics || !statistics.questionStats) return null;

    const totalQuestions = statistics.questionStats.length;
    const difficultyBreakdown = {
      easy: statistics.questionStats.filter(q => q.successRate >= 70).length,
      medium: statistics.questionStats.filter(q => q.successRate >= 40 && q.successRate < 70).length,
      hard: statistics.questionStats.filter(q => q.successRate < 40).length
    };

    // Calculate percentage
    const difficultyPercentage = {
      easy: totalQuestions ? Math.round((difficultyBreakdown.easy / totalQuestions) * 100) : 0,
      medium: totalQuestions ? Math.round((difficultyBreakdown.medium / totalQuestions) * 100) : 0,
      hard: totalQuestions ? Math.round((difficultyBreakdown.hard / totalQuestions) * 100) : 0
    };

    return { difficultyBreakdown, difficultyPercentage };
  }, [statistics]);

  // Chart data for question performance
  const questionChartData = useMemo(() => {
    if (!statistics?.questionStats?.length) return null;

    return {
      labels: statistics.questionStats.map((q, idx) => `Q${idx + 1}`),
      datasets: [
        {
          label: 'Success Rate (%)',
          data: statistics.questionStats.map(q => Math.round(q.successRate)),
          backgroundColor: statistics.questionStats.map(q => 
            q.successRate >= 70 ? 'rgba(34, 197, 94, 0.6)' : 
            q.successRate >= 40 ? 'rgba(234, 179, 8, 0.6)' : 
            'rgba(239, 68, 68, 0.6)'
          ),
          borderColor: statistics.questionStats.map(q => 
            q.successRate >= 70 ? 'rgb(34, 197, 94)' : 
            q.successRate >= 40 ? 'rgb(234, 179, 8)' : 
            'rgb(239, 68, 68)'
          ),
          borderWidth: 1
        }
      ]
    };
  }, [statistics]);

  // Chart options
  const chartOptions = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Success Rate (%)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Questions'
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          title: function(tooltipItems) {
            if (!statistics?.questionStats) return '';
            const idx = tooltipItems[0].dataIndex;
            return statistics.questionStats[idx]?.text?.substring(0, 50) + '...';
          }
        }
      },
      legend: {
        display: false
      }
    },
    maintainAspectRatio: false
  };

  // Difficulty distribution chart
  const difficultyChartData = useMemo(() => {
    if (!aggregateData) return null;
    
    return {
      labels: ['Easy', 'Medium', 'Hard'],
      datasets: [
        {
          label: 'Number of Questions',
          data: [
            aggregateData.difficultyBreakdown.easy,
            aggregateData.difficultyBreakdown.medium,
            aggregateData.difficultyBreakdown.hard
          ],
          backgroundColor: [
            'rgba(34, 197, 94, 0.6)',
            'rgba(234, 179, 8, 0.6)',
            'rgba(239, 68, 68, 0.6)'
          ],
          borderColor: [
            'rgb(34, 197, 94)',
            'rgb(234, 179, 8)',
            'rgb(239, 68, 68)'
          ],
          borderWidth: 1
        }
      ]
    };
  }, [aggregateData]);

  // Improved format duration function from QuizResults component
  const formatDuration = (timeInMs) => {
    if (timeInMs === null || timeInMs === undefined || isNaN(timeInMs)) {
      return 'N/A';
    }
    
    // Convert to seconds if needed
    const seconds = typeof timeInMs === 'number' && timeInMs > 1000 
      ? Math.floor(timeInMs / 1000)  // If milliseconds are provided
      : Math.floor(timeInMs);        // If seconds are already provided
    
    if (seconds <= 0) return 'N/A';
    
    // Handle hours, minutes, seconds for better human readability
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
  
    const parts = [];
    
    // Only include hours if there are any
    if (hours > 0) {
      parts.push(`${hours}h`);
    }
    
    // Only include minutes if there are any or if we're showing hours
    if (minutes > 0 || hours > 0) {
      parts.push(`${minutes}m`);
    }
    
    // Always include seconds unless we have hours and minutes
    if (remainingSeconds > 0 || parts.length === 0) {
      parts.push(`${remainingSeconds}s`);
    }
  
    return parts.join(' ');
  };

  const formatScore = (score, maxScore) => {
    if (score === null || score === undefined) return 'N/A';
    if (maxScore) return `${score}/${maxScore} (${Math.round((score / maxScore) * 100)}%)`;
    return `${score} pts`;
  };

  // Handle download CSV report
  const downloadCSV = () => {
    if (!statistics || !quiz) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add quiz info
    csvContent += `Quiz Name,${quiz.title}\n`;
    csvContent += `Total Attempts,${statistics.totalAttempts}\n`;
    csvContent += `Average Score,${Math.round(statistics.averageScore)}%\n`;
    csvContent += `Pass Rate,${Math.round(statistics.passRate)}%\n`;
    csvContent += `Unique Users,${statistics.uniqueUsers}\n\n`;
    
    // Add question stats
    csvContent += "Question,Correct Answers,Total Attempts,Success Rate,Difficulty\n";
    statistics.questionStats.forEach(q => {
      const difficulty = q.successRate >= 70 ? 'Easy' : q.successRate >= 40 ? 'Medium' : 'Hard';
      csvContent += `"${q.text}",${q.correctCount},${q.totalAttempts},${Math.round(q.successRate)}%,${difficulty}\n`;
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${quiz.title}_statistics.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 bg-white rounded-lg shadow-md">
        <div className="text-center p-10">
          <Loader className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading your quiz statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex flex-col sm:flex-row">
            <div className="flex-shrink-0 mb-2 sm:mb-0">
              <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="sm:ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/admin/quizzes')} 
            className="mt-4 bg-red-500 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
      {/* Header with title and action buttons */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">{quiz?.title || 'Quiz Statistics'}</h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {statistics && (
            <button 
              onClick={downloadCSV}
              className="bg-green-500 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded flex items-center justify-center sm:justify-start w-full sm:w-auto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          )}
          <Link 
            to="/admin/quizzes" 
            className="bg-gray-500 hover:bg-gray-700 text-white px-3 sm:px-4 py-2 rounded flex items-center justify-center sm:justify-start w-full sm:w-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Quizzes
          </Link>
        </div>
      </div>

      {/* No statistics message */}
      {statistics && statistics.totalAttempts === 0 && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">No attempts have been made for this quiz yet.</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation tabs - scrollable on mobile */}
      {statistics && statistics.totalAttempts > 0 && (
        <div className="mb-6 overflow-x-auto">
          <div className="border-b border-gray-200 min-w-max">
            <nav className="-mb-px flex space-x-4 sm:space-x-8">
              {[
                { key: 'summary', label: 'Summary' },
                { key: 'questions', label: 'Question Analysis' },
                { key: 'attempts', label: 'Recent Attempts' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Summary Tab */}
      {statistics && statistics.totalAttempts > 0 && activeTab === 'summary' && (
        <>
          {/* Summary Stats - Responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {[
              { label: "Total Attempts", value: statistics?.totalAttempts || 0, color: "text-blue-600", icon: (
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
              )},
              { label: "Average Score", value: statistics?.averageScore !== undefined ? `${Math.round(statistics.averageScore)}%` : "N/A", color: "text-green-600", icon: (
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              )},
              { label: "Pass Rate", value: statistics?.passRate !== undefined ? `${Math.round(statistics.passRate)}%` : "N/A", color: "text-indigo-600", icon: (
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              )},
              { label: "Unique Users", value: statistics?.uniqueUsers || 0, color: "text-purple-600", icon: (
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
              )},
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow-md p-4 sm:p-6 flex items-center">
                <div className="bg-gray-100 rounded-full p-2 sm:p-3 mr-3 sm:mr-4">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-700">{item.label}</h3>
                  <p className={`text-xl sm:text-2xl md:text-3xl font-bold ${item.color}`}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Difficulty Distribution - Stacks on mobile, side by side on larger screens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 sm:mb-8">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-4">Quiz Difficulty Breakdown</h2>
              {aggregateData && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Easy", value: aggregateData.difficultyPercentage.easy, color: "bg-green-100 text-green-800", count: aggregateData.difficultyBreakdown.easy },
                    { label: "Medium", value: aggregateData.difficultyPercentage.medium, color: "bg-yellow-100 text-yellow-800", count: aggregateData.difficultyBreakdown.medium },
                    { label: "Hard", value: aggregateData.difficultyPercentage.hard, color: "bg-red-100 text-red-800", count: aggregateData.difficultyBreakdown.hard },
                  ].map((item, idx) => (
                    <div key={idx} className="text-center p-2">
                      <p className={`text-lg font-semibold ${item.color.split(' ')[1]}`}>{item.label}</p>
                      <div className={`flex items-center justify-center rounded-full w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 ${item.color} mx-auto`}>
                        <span className="text-xl sm:text-2xl font-bold">{item.value}%</span>
                      </div>
                      <p className="mt-2 text-sm sm:text-base text-gray-600">{item.count} questions</p>
                    </div>
                  ))}
                </div>
              )}
              {!aggregateData && <p className="text-center text-gray-500 py-4">No data available.</p>}
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-4">Difficulty Distribution</h2>
              {difficultyChartData ? (
                <div className="h-48 sm:h-56 md:h-64">
                  <Bar data={difficultyChartData} options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Number of Questions'
                        }
                      }
                    },
                    maintainAspectRatio: false
                  }} />
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">No data available.</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Question Analysis Tab */}
      {statistics && statistics.totalAttempts > 0 && activeTab === 'questions' && (
        <>
          {/* Question Performance Chart - Adjusts height based on screen size */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">Question Success Rates</h2>
            {questionChartData ? (
              <div className="h-60 sm:h-72 md:h-80">
                <Bar data={questionChartData} options={chartOptions} />
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No question statistics available.</p>
            )}
          </div>

          {/* Question Table - Responsive with horizontal scroll on mobile */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">Question Details</h2>
            {statistics?.questionStats?.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q#</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correct</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difficulty</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {statistics.questionStats.map((q, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium text-gray-900">Q{index + 1}</td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 max-w-xs md:max-w-sm lg:max-w-md truncate">{q.text}</td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">{q.correctCount}/{q.totalAttempts}</td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center">
                            <span className={`px-1 sm:px-2 py-1 inline-flex text-xs font-semibold rounded-full ${
                              q.successRate >= 70 ? 'bg-green-100 text-green-800' :
                              q.successRate >= 40 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {Math.round(q.successRate)}%
                            </span>
                            <div className="ml-2 sm:ml-4 w-16 sm:w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  q.successRate >= 70 ? 'bg-green-500' :
                                  q.successRate >= 40 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${Math.round(q.successRate)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                          <span className={`px-1 sm:px-2 py-1 inline-flex text-xs font-semibold rounded-full ${
                            q.successRate >= 70 ? 'bg-green-100 text-green-800' :
                            q.successRate >= 40 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {q.successRate >= 70 ? 'Easy' : q.successRate >= 40 ? 'Medium' : 'Hard'}
                          </span>
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
        </>
      )}

      {/* Recent Attempts Tab */}
      {statistics && statistics.totalAttempts > 0 && activeTab === 'attempts' && (
       <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
       <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
         <h2 className="text-xl md:text-2xl font-bold">Recent Attempts</h2>
         {attempts.length > 0 && (
           <Link 
             to={`/admin/quizzes/${id}/attempts`}
             className="text-blue-500 hover:text-blue-700 text-sm font-medium"
           >
             View All Attempts
           </Link>
         )}
       </div>
       {attempts.length ? (
         <div className="overflow-x-auto -mx-4 sm:mx-0">
           {/* Large screens - full table */}
           <table className="hidden md:table min-w-full divide-y divide-gray-200">
             <thead className="bg-gray-50">
               <tr>
                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Taken</th>
                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
               </tr>
             </thead>
             <tbody className="bg-white divide-y divide-gray-200">
               {attempts.map((attempt) => (
                 <tr key={attempt._id} className="hover:bg-gray-50">
                   <td className="px-4 py-4">
                     <div className="flex items-center">
                       <div className="flex-shrink-0 h-8 w-8 md:h-10 md:w-10">
                         <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-gray-200 flex items-center justify-center">
                           <span className="text-gray-500 font-medium">
                             {attempt.user?.name ? attempt.user.name.charAt(0).toUpperCase() : '?'}
                           </span>
                         </div>
                       </div>
                       <div className="ml-3 md:ml-4">
                         <div className="text-sm font-medium text-gray-900">{attempt.user?.name || 'Unknown'}</div>
                         <div className="text-xs md:text-sm text-gray-500">{attempt.user?.email || '-'}</div>
                       </div>
                     </div>
                   </td>
                   <td className="px-4 py-4">
                     <div className="text-sm text-gray-900">
                       {new Date(attempt.createdAt).toLocaleDateString()}
                     </div>
                     <div className="text-xs md:text-sm text-gray-500">
                       {new Date(attempt.createdAt).toLocaleTimeString()}
                     </div>
                   </td>
                   <td className="px-4 py-4">
                     <div className="flex items-center">
                       <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${
                         (attempt.score) >= 70 ? 'bg-green-100 text-green-800' :
                         (attempt.score) >= 40 ? 'bg-yellow-100 text-yellow-800' :
                         'bg-red-100 text-red-800'
                       }`}>
                         {Math.round((attempt.score))}%
                       </span>
                       <span className="ml-2 text-xs md:text-sm text-gray-500">
                         {formatScore(attempt.score, attempt.maxScore)}
                       </span>
                     </div>
                   </td>
                   <td className="px-4 py-4 text-sm text-gray-900">
                     {formatDuration(attempt.timeTaken)}
                   </td>
                   <td className="px-4 py-4 text-sm text-blue-500">
                     <Link 
                       to={`/attempts/${attempt._id}`} 
                       className="inline-flex items-center hover:text-blue-700"
                     >
                       <span>Details</span>
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                       </svg>
                     </Link>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
           
           {/* Mobile card view */}
           <div className="md:hidden space-y-4 px-4">
             {attempts.map((attempt) => (
               <div key={attempt._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                 <div className="flex items-center mb-3">
                   <div className="flex-shrink-0 h-10 w-10">
                     <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                       <span className="text-gray-500 font-medium">
                         {attempt.user?.name ? attempt.user.name.charAt(0).toUpperCase() : '?'}
                       </span>
                     </div>
                   </div>
                   <div className="ml-3">
                     <div className="text-sm font-medium text-gray-900">{attempt.user?.name || 'Unknown'}</div>
                     <div className="text-xs text-gray-500">{attempt.user?.email || '-'}</div>
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                   <div>
                     <div className="text-gray-500 font-medium">Date</div>
                     <div>{new Date(attempt.createdAt).toLocaleDateString()}</div>
                     <div className="text-xs text-gray-500">
                       {new Date(attempt.createdAt).toLocaleTimeString()}
                     </div>
                   </div>
                   
                   <div>
                     <div className="text-gray-500 font-medium">Time Taken</div>
                     <div>{formatDuration(attempt.timeTaken)}</div>
                   </div>
                 </div>
                 
                 <div className="mb-4">
                   <div className="text-gray-500 font-medium text-sm mb-1">Score</div>
                   <div className="flex items-center">
                     <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${
                       (attempt.score) >= 70 ? 'bg-green-100 text-green-800' :
                       (attempt.score) >= 40 ? 'bg-yellow-100 text-yellow-800' :
                       'bg-red-100 text-red-800'
                     }`}>
                       {Math.round((attempt.score))}%
                     </span>
                     <span className="ml-2 text-sm text-gray-500">
                       {formatScore(attempt.score, attempt.maxScore)}
                     </span>
                   </div>
                 </div>
                 
                 <Link 
                   to={`/attempts/${attempt._id}`}
                   className="block w-full text-center bg-blue-50 hover:bg-blue-100 text-blue-500 font-medium py-2 px-4 rounded-md transition-colors"
                 >
                   View Details
                 </Link>
               </div>
             ))}
           </div>
         </div>
       ) : (
         <div className="py-6 md:py-8 text-center">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 md:h-16 md:w-16 text-gray-400 mx-auto mb-3 md:mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
           </svg>
           <p className="text-gray-500">No attempts recorded yet.</p>
         </div>
       )}
     </div>
        )}
    </div>
  );
};

export default QuizStatistics;