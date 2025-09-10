import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { Loader, AlertTriangle, PlusCircle, ArrowLeft, Edit, Trash2, GripVertical, Check, Save, X } from 'lucide-react';

const ManageQuestions = () => {
  const { id: quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null); // Holds the question object being edited

  const fetchQuizData = async () => {
    try {
      setLoading(true);
      const [quizRes, questionsRes] = await Promise.all([
        api.get(`/quizzes/${quizId}`),
        api.get(`/quizzes/${quizId}/questions?withAnswers=true`)
      ]);
      setQuiz(quizRes.data.quiz);
      setQuestions(questionsRes.data.questions);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load quiz data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizData();
  }, [quizId]);

  const handleOpenModal = (question = null) => {
    setEditingQuestion(question);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingQuestion(null);
  };

  const handleSaveQuestion = async (questionData) => {
    try {
      if (editingQuestion) { // Update existing question
        await api.put(`/quizzes/${quizId}/questions/${editingQuestion._id}`, questionData);
        toast.success('Question updated successfully!', { theme: 'dark' });
      } else { // Create new question
        await api.post(`/quizzes/${quizId}/questions`, questionData);
        toast.success('Question added successfully!', { theme: 'dark' });
      }
      fetchQuizData(); // Refresh data from server
      handleCloseModal();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to save question.';
      toast.error(errorMsg, { theme: 'dark' });
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await api.delete(`/quizzes/${quizId}/questions/${questionId}`);
      toast.success('Question deleted.', { theme: 'dark' });
      setQuestions(prev => prev.filter(q => q._id !== questionId));
    } catch (err) {
      toast.error('Failed to delete question.', { theme: 'dark' });
    }
  };

  // Drag and Drop State and Handlers
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const handleDragSort = async () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    
    const questionsCopy = [...questions];
    const draggedItemContent = questionsCopy.splice(dragItem.current, 1)[0];
    questionsCopy.splice(dragOverItem.current, 0, draggedItemContent);
    
    dragItem.current = null;
    dragOverItem.current = null;
    
    setQuestions(questionsCopy); // Optimistic update
    
    const questionIds = questionsCopy.map(q => q._id);
    try {
      // Assuming an endpoint to update order exists
      await api.put(`/quizzes/${quizId}/questions/order`, { questionIds });
      toast.success('Question order saved.', { theme: 'dark' });
    } catch (err) {
      toast.error('Failed to save new order.', { theme: 'dark' });
      setQuestions(questions); // Revert on failure
    }
  };


  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader className="animate-spin h-8 w-8 text-gray-500"/></div>;
  }

  if (error) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="bg-gray-950 border border-gray-800 rounded-2xl p-8 max-w-lg w-full text-center">
          <AlertTriangle className="h-12 w-12 text-red-500/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Error Loading Data</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <button onClick={fetchQuizData} className="px-5 py-2 bg-white text-black rounded-lg hover:bg-gray-200 font-semibold transition-colors">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Link to="/admin/quizzes" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={16} /> Back to Quizzes
            </Link>
            <h1 className="text-4xl font-bold text-white mt-1">{quiz?.title}</h1>
            <p className="text-gray-400 mt-1">Manage the questions for this quiz.</p>
          </div>
          <button onClick={() => handleOpenModal()} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors">
            <PlusCircle size={16} /> Add Question
          </button>
        </header>

        <div className="bg-gray-950 border border-gray-800 rounded-2xl">
          <div className="p-4 border-b border-gray-800">
            <h2 className="font-semibold text-white">{questions.length} Questions</h2>
          </div>
          <div className="p-4 space-y-3">
            {questions.length > 0 ? (
              questions.map((q, index) => (
                <div 
                  key={q._id}
                  className="flex items-center gap-3 p-3 bg-gray-900 border border-gray-800 rounded-lg group"
                  draggable
                  onDragStart={() => dragItem.current = index}
                  onDragEnter={() => dragOverItem.current = index}
                  onDragEnd={handleDragSort}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <GripVertical className="text-gray-600 cursor-grab group-hover:text-gray-400"/>
                  <div className="flex-grow">
                    <p className="text-white font-medium">{index + 1}. {q.text}</p>
                    <p className="text-xs text-green-400 mt-1">Correct Answer: {q.options.find(opt => opt.isCorrect)?.text}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleOpenModal(q)} className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-md"><Edit size={16}/></button>
                    <button onClick={() => handleDeleteQuestion(q._id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded-md"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No questions have been added to this quiz yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {isModalOpen && <QuestionModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveQuestion} questionData={editingQuestion} quizId={quizId} />}
    </>
  );
};

// --- Modal Component ---
const QuestionModal = ({ isOpen, onClose, onSave, questionData, quizId }) => {
  const [question, setQuestion] = useState({
    text: '',
    options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
    correctOptionIndex: 0,
    points: 1
  });

  useEffect(() => {
    if (questionData) {
      setQuestion({
        text: questionData.text,
        options: questionData.options.map(opt => ({ text: opt.text })),
        correctOptionIndex: questionData.options.findIndex(opt => opt.isCorrect),
        points: questionData.points
      });
    } else {
      setQuestion({
        text: '',
        options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
        correctOptionIndex: 0,
        points: 1
      });
    }
  }, [questionData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setQuestion(prev => ({ ...prev, [name]: value }));
  };
  
  const handleOptionChange = (index, value) => {
    const newOptions = [...question.options];
    newOptions[index].text = value;
    setQuestion(prev => ({ ...prev, options: newOptions }));
  };

  const handleCorrectOptionChange = (index) => {
    setQuestion(prev => ({ ...prev, correctOptionIndex: index }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formattedData = {
      text: question.text,
      options: question.options.map((opt, index) => ({
        text: opt.text,
        isCorrect: index === question.correctOptionIndex,
      })),
      points: Number(question.points),
      quizId: quizId,
    };
    onSave(formattedData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-gray-950 border border-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">{questionData ? 'Edit Question' : 'Add New Question'}</h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-full"><X size={20}/></button>
        </header>
        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-6">
          <div className="relative">
            <textarea id="text" name="text" rows="3" className="peer w-full px-4 py-3 bg-transparent border border-gray-700 rounded-lg placeholder-transparent focus:outline-none focus:ring-1 focus:ring-gray-500" placeholder="Question Text" value={question.text} onChange={handleChange} required />
            <label htmlFor="text" className="absolute left-4 -top-2.5 text-xs text-gray-400 bg-gray-950 px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-gray-400">Question Text</label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Options</label>
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <div key={index} className="flex items-center gap-3">
                  <button type="button" onClick={() => handleCorrectOptionChange(index)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${question.correctOptionIndex === index ? 'border-white bg-white' : 'border-gray-600'}`}>
                    {question.correctOptionIndex === index && <Check size={16} className="text-black" />}
                  </button>
                  <input type="text" value={option.text} onChange={(e) => handleOptionChange(index, e.target.value)} className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-600" placeholder={`Option ${index + 1}`} required />
                </div>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="points" className="block text-sm font-medium text-gray-400 mb-2">Points</label>
            <input id="points" name="points" type="number" min="1" value={question.points} onChange={handleChange} className="w-24 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-600"/>
          </div>
        </form>
        <footer className="flex justify-end gap-3 p-4 border-t border-gray-800 bg-gray-950/50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 bg-gray-800 text-white rounded-lg font-semibold text-sm hover:bg-gray-700">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-white text-black rounded-lg font-semibold text-sm hover:bg-gray-200 flex items-center gap-2"><Save size={16}/> Save Question</button>
        </footer>
      </div>
    </div>
  );
};

export default ManageQuestions;

