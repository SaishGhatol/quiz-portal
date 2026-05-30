import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import {
  Loader, AlertTriangle, Plus, ArrowLeft, Edit, Trash2,
  GripVertical, Save, X, Check, Upload, ChevronDown
} from 'lucide-react';

/* ─── Shared input class ─────────────────────────────────────────────────── */
const inp = 'w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';

/* ─── Question Form Modal ─────────────────────────────────────────────────── */
const QuestionModal = ({ onClose, onSave, initial, quizId }) => {
  const defaultOpts = [{ text: '' }, { text: '' }, { text: '' }, { text: '' }];
  const [form, setForm] = useState({
    text: '', options: defaultOpts, correctIdx: 0, points: 1, explanation: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm({
        text:        initial.text,
        options:     initial.options.map(o => ({ text: o.text })),
        correctIdx:  initial.options.findIndex(o => o.isCorrect),
        points:      initial.points || 1,
        explanation: initial.explanation || '',
      });
    } else {
      setForm({ text: '', options: defaultOpts, correctIdx: 0, points: 1, explanation: '' });
    }
  }, [initial]);

  const addOption = () => {
    if (form.options.length >= 6) return;
    setForm(p => ({ ...p, options: [...p.options, { text: '' }] }));
  };

  const removeOption = i => {
    if (form.options.length <= 2) return;
    setForm(p => ({
      ...p,
      options: p.options.filter((_, idx) => idx !== i),
      correctIdx: p.correctIdx >= i ? Math.max(0, p.correctIdx - 1) : p.correctIdx,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.text.trim()) return toast.error('Question text is required');
    if (form.options.some(o => !o.text.trim())) return toast.error('All options must have text');
    setSaving(true);
    try {
      await onSave({
        text: form.text,
        options: form.options.map((o, i) => ({ text: o.text, isCorrect: i === form.correctIdx })),
        points: Number(form.points) || 1,
        explanation: form.explanation,
        quizId,
      });
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-bold text-gray-900 dark:text-white">{initial ? 'Edit question' : 'New question'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} id="question-form" className="overflow-y-auto flex-1 p-6 space-y-5">

          {/* Question text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Question *</label>
            <textarea rows={3} value={form.text} onChange={e => setForm(p => ({ ...p, text: e.target.value }))}
              placeholder="Enter the question text…" className={`${inp} resize-none`} />
          </div>

          {/* Options */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Answer options <span className="text-gray-400 font-normal">(click circle to mark correct)</span>
              </label>
              <button type="button" onClick={addOption} disabled={form.options.length >= 6}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-40">
                + Add option
              </button>
            </div>
            <div className="space-y-2">
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  {/* Correct answer selector */}
                  <button type="button" onClick={() => setForm(p => ({ ...p, correctIdx: i }))}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                      ${form.correctIdx === i
                        ? 'border-green-500 bg-green-500'
                        : 'border-gray-300 dark:border-gray-600 hover:border-green-400'}`}>
                    {form.correctIdx === i && <Check className="h-3.5 w-3.5 text-white" />}
                  </button>
                  <input value={opt.text}
                    onChange={e => {
                      const opts = [...form.options];
                      opts[i] = { text: e.target.value };
                      setForm(p => ({ ...p, options: opts }));
                    }}
                    placeholder={`Option ${i + 1}${i === form.correctIdx ? ' (correct)' : ''}`}
                    className={`${inp} flex-1 ${form.correctIdx === i ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/10' : ''}`} />
                  {form.options.length > 2 && (
                    <button type="button" onClick={() => removeOption(i)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
              <Check className="h-3 w-3" /> Option {form.correctIdx + 1} is marked as correct
            </p>
          </div>

          {/* Points + Explanation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Points</label>
              <input type="number" min="1" value={form.points}
                onChange={e => setForm(p => ({ ...p, points: e.target.value }))}
                className={`${inp} w-28`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Explanation <span className="text-gray-400 font-normal">(shown after submit)</span></label>
              <input value={form.explanation} onChange={e => setForm(p => ({ ...p, explanation: e.target.value }))}
                placeholder="Why is the answer correct?" className={inp} />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <button onClick={onClose} type="button"
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Cancel
          </button>
          <button form="question-form" type="submit" disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60">
            {saving ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {initial ? 'Save changes' : 'Add question'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Bulk Import Modal ───────────────────────────────────────────────────── */
const BulkImportModal = ({ onClose, onImport, quizId }) => {
  const [text,    setText]    = useState('');
  const [loading, setLoading] = useState(false);

  const EXAMPLE = JSON.stringify([
    {
      text: "What is 2 + 2?",
      options: [
        { text: "3", isCorrect: false },
        { text: "4", isCorrect: true },
        { text: "5", isCorrect: false }
      ],
      points: 1,
      explanation: "Basic arithmetic."
    }
  ], null, 2);

  const handleImport = async () => {
    let questions;
    try { questions = JSON.parse(text); }
    catch { toast.error('Invalid JSON — check the format'); return; }
    if (!Array.isArray(questions) || questions.length === 0) {
      toast.error('Paste a non-empty JSON array of questions'); return;
    }
    setLoading(true);
    try {
      await onImport(questions);
      onClose();
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">Bulk import questions</h2>
            <p className="text-xs text-gray-400 mt-0.5">Paste a JSON array of question objects</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">JSON input</label>
              <button type="button" onClick={() => setText(EXAMPLE)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                Load example
              </button>
            </div>
            <textarea rows={16} value={text} onChange={e => setText(e.target.value)}
              placeholder={EXAMPLE} spellCheck={false}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-xs font-mono text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Each object needs <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">text</code>,{' '}
            <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">options[]</code> (each with <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">text</code> + <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">isCorrect</code>).
            Optional: <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">points</code>, <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">explanation</code>.
          </p>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
          <button onClick={handleImport} disabled={loading || !text.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg disabled:opacity-60">
            {loading ? <Loader className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Import {text.trim() ? '' : '…'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Component ─────────────────────────────────────────────────────── */
const ManageQuestions = () => {
  const { id: quizId } = useParams();
  const [quiz,      setQuiz]      = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [modal,     setModal]     = useState(null); // 'add' | 'edit' | 'import'
  const [editing,   setEditing]   = useState(null);
  const [deleting,  setDeleting]  = useState(null);
  const dragItem     = useRef(null);
  const dragOverItem = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const [qr, qqr] = await Promise.all([
        api.get(`/quizzes/${quizId}`),
        api.get(`/quizzes/${quizId}/questions?withAnswers=true`),
      ]);
      setQuiz(qr.data.quiz);
      setQuestions(qqr.data.questions || []);
    } catch { setError('Failed to load quiz data.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [quizId]);

  const handleSave = async (data) => {
    try {
      if (editing) {
        await api.put(`/quizzes/${quizId}/questions/${editing._id}`, data);
        toast.success('Question updated');
      } else {
        await api.post(`/quizzes/${quizId}/questions`, data);
        toast.success('Question added');
      }
      setModal(null); setEditing(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
  };

  const handleBulkImport = async (questions) => {
    try {
      await api.post('/questions/bulk', { quizId, questions });
      toast.success(`${questions.length} questions imported`);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Import failed'); }
  };

  const handleDelete = async (qid) => {
    setDeleting(qid);
    try {
      await api.delete(`/questions/${qid}`);
      toast.success('Question deleted');
      setQuestions(p => p.filter(q => q._id !== qid));
    } catch { toast.error('Failed to delete'); }
    finally { setDeleting(null); }
  };

  const handleDragEnd = async () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const arr = [...questions];
    const [moved] = arr.splice(dragItem.current, 1);
    arr.splice(dragOverItem.current, 0, moved);
    setQuestions(arr);
    dragItem.current = null; dragOverItem.current = null;
    try {
      await api.put(`/admin/quizzes/${quizId}/questions/order`, { questionIds: arr.map(q => q._id) });
    } catch { toast.error('Failed to save order'); }
  };

  if (loading) return <div className="flex justify-center items-center min-h-[50vh] bg-white dark:bg-gray-950"><Loader className="animate-spin h-6 w-6 text-indigo-500" /></div>;
  if (error)   return (
    <div className="min-h-[50vh] bg-white dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center">
        <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error}</p>
        <button onClick={load} className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700">Retry</button>
      </div>
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
            <div>
              <Link to="/admin/quizzes" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1 mb-2">
                <ArrowLeft className="h-3.5 w-3.5" /> Quizzes
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{quiz?.title}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {questions.length} question{questions.length !== 1 ? 's' : ''} · drag rows to reorder
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setModal('import')}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <Upload className="h-4 w-4" /> Bulk import
              </button>
              <button onClick={() => { setEditing(null); setModal('add'); }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">
                <Plus className="h-4 w-4" /> Add question
              </button>
            </div>
          </div>

          {/* Questions list */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            {questions.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-gray-500 dark:text-gray-400 text-sm">No questions yet.</p>
                <button onClick={() => setModal('add')}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700">
                  <Plus className="h-4 w-4" /> Add first question
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {questions.map((q, idx) => (
                  <div key={q._id}
                    className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group cursor-grab active:cursor-grabbing"
                    draggable
                    onDragStart={() => dragItem.current = idx}
                    onDragEnter={() => dragOverItem.current = idx}
                    onDragEnd={handleDragEnd}
                    onDragOver={e => e.preventDefault()}>

                    <GripVertical className="h-5 w-5 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 shrink-0 mt-0.5" />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        <span className="text-gray-400 mr-1.5">{idx + 1}.</span>{q.text}
                      </p>
                      {/* Correct answer preview */}
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        {q.options.find(o => o.isCorrect)?.text || 'No correct answer set'}
                      </p>
                      {q.explanation && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">💡 {q.explanation}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-gray-400 dark:text-gray-500 px-2">{q.points}pt</span>
                      <button onClick={() => { setEditing(q); setModal('edit'); }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(q._id)} disabled={deleting === q._id}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        {deleting === q._id ? <Loader className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Score summary */}
          {questions.length > 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-right mt-3">
              Total: {questions.reduce((s, q) => s + (q.points || 1), 0)} points across {questions.length} questions
            </p>
          )}
        </div>
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <QuestionModal
          initial={modal === 'edit' ? editing : null}
          quizId={quizId}
          onClose={() => { setModal(null); setEditing(null); }}
          onSave={handleSave}
        />
      )}
      {modal === 'import' && (
        <BulkImportModal
          quizId={quizId}
          onClose={() => setModal(null)}
          onImport={handleBulkImport}
        />
      )}
    </>
  );
};

export default ManageQuestions;
