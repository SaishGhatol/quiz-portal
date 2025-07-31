import React, { useState } from 'react';

const DemoQuiz = () => {
  const demoQuestions = [
    {
      question: "What is the capital of France?",
      options: ["Berlin", "Madrid", "Paris", "Rome"],
      correct: "Paris"
    },
    {
      question: "Which language runs in a web browser?",
      options: ["Python", "Java", "C++", "JavaScript"],
      correct: "JavaScript"
    },
    {
      question: "What does CSS stand for?",
      options: [
        "Central Style Sheets",
        "Cascading Style Sheets",
        "Cascading Simple Sheets",
        "Cars SUVs Sailboats"
      ],
      correct: "Cascading Style Sheets"
    }
  ];

  const [quizStarted, setQuizStarted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const handleStartQuiz = () => {
    setQuizStarted(true);
    setAnswers({});
    setSubmitted(false);
    setScore(0);
  };

  const handleOptionChange = (qIndex, option) => {
    setAnswers(prev => ({ ...prev, [qIndex]: option }));
  };

  const handleSubmit = () => {
    let correctCount = 0;
    demoQuestions.forEach((q, index) => {
      if (answers[index] === q.correct) {
        correctCount++;
      }
    });
    setScore(correctCount);
    setSubmitted(true);
  };

  const handleReset = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
  };

  return (
    <div className="my-24 w-full bg-gradient-to-b from-indigo-50 to-white py-16 rounded-3xl shadow-xl">
      <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-14">
        Try a Demo Quiz
      </h2>
      <div className="max-w-6xl mx-auto px-4">

        {!quizStarted ? (
          <button
            onClick={handleStartQuiz}
            className="block mx-auto text-center bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:bg-blue-700 transition duration-300"
          >
            Start Demo Quiz
          </button>
        ) : (
          <div className="space-y-10">
            {demoQuestions.map((q, index) => (
              <div key={index} className="p-6 bg-white rounded-xl shadow-md border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">{q.question}</h3>
                <div className="space-y-3">
                  {q.options.map((option, i) => (
                    <label key={i} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name={`question-${index}`}
                        value={option}
                        checked={answers[index] === option}
                        onChange={() => handleOptionChange(index, option)}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {!submitted ? (
              <button
                onClick={handleSubmit}
                className="block mx-auto bg-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:bg-green-700 transition duration-300"
              >
                Submit Quiz
              </button>
            ) : (
              <div className="text-center space-y-6">
                <p className="text-xl font-semibold text-gray-800">
                  You scored {score} out of {demoQuestions.length}
                </p>
                <button
                  onClick={handleReset}
                  className="bg-yellow-500 text-white font-semibold py-2 px-5 rounded-lg shadow-md hover:bg-yellow-600 transition duration-300"
                >
                  Reset Demo Quiz
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DemoQuiz;
