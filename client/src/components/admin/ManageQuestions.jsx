import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import {
  Loader, Plus, Edit, Trash2, HelpCircle,
  GripVertical, Save, X, Check, Upload
} from 'lucide-react';
import { Page, PageHeader, Button, Spinner, ErrorState, EmptyState, Badge } from '../ui';
import ConfirmDialog from '../ConfirmDialog';

/* ─── Shared input class ─────────────────────────────────────────────────── */
const inp = 'w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent';

/* ─── Question Form Modal ─────────────────────────────────────────────────── */
const MAX_OPTIONS = 10;
const TRUE_FALSE = [{ text: 'True' }, { text: 'False' }];
const QUESTION_TYPES = [
  { value: 'single',    label: 'Multiple choice (one answer)' },
  { value: 'truefalse', label: 'True / False' },
];
const typeLabel = t => (t === 'truefalse' ? 'True/False' : t === 'multiple' ? 'Multi-answer' : t === 'text' ? 'Text' : 'Single');

const emptyForm = () => ({
  type: 'single', text: '', options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
  correctIdx: 0, points: 1, explanation: '',
});

const QuestionModal = ({ onClose, onSave, initial, quizId }) => {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const isTF = form.type === 'truefalse';

  useEffect(() => {
    if (initial) {
      const correctIdx = initial.options.findIndex(o => o.isCorrect);
      setForm({
        type:        initial.type === 'truefalse' ? 'truefalse' : 'single',
        text:        initial.text,
        options:     initial.options.map(o => ({ text: o.text })),
        correctIdx:  correctIdx >= 0 ? correctIdx : 0,
        points:      initial.points ?? 1,
        explanation: initial.explanation || '',
      });
    } else {
      setForm(emptyForm());
    }
  }, [initial]);

  const changeType = type => setForm(p => ({
    ...p,
    type,
    options: type === 'truefalse'
      ? TRUE_FALSE.map(o => ({ ...o }))
      : (p.type === 'truefalse' ? emptyForm().options : p.options),
    correctIdx: 0,
  }));

  const addOption = () => {
    if (isTF || form.options.length >= MAX_OPTIONS) return;
    setForm(p => ({ ...p, options: [...p.options, { text: '' }] }));
  };

  const removeOption = i => {
    if (isTF || form.options.length <= 2) return;
    setForm(p => ({
      ...p,
      options: p.options.filter((_, idx) => idx !== i),
      correctIdx: p.correctIdx > i ? p.correctIdx - 1 : p.correctIdx === i ? 0 : p.correctIdx,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.text.trim()) return toast.error('Question text is required');
    if (form.options.some(o => !o.text.trim())) return toast.error('All options must have text');
    const points = Number(form.points);
    if (!Number.isFinite(points) || points < 0 || points > 100) return toast.error('Points must be between 0 and 100');
    setSaving(true);
    try {
      await onSave({
        type: form.type,
        text: form.text.trim(),
        options: form.options.map((o, i) => ({ text: o.text.trim(), isCorrect: i === form.correctIdx })),
        points,
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
          <button onClick={onClose} title="Close" aria-label="Close dialog" className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} id="question-form" className="overflow-y-auto flex-1 p-6 space-y-5">

          {/* Question type */}
          <div>
            <label htmlFor="question-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
            <select id="question-type" value={form.type} onChange={e => changeType(e.target.value)} className={inp}>
              {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

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
              {!isTF && (
                <button type="button" onClick={addOption} disabled={form.options.length >= MAX_OPTIONS}
                  className="text-xs text-brand-600 dark:text-brand-400 hover:underline disabled:opacity-40">
                  + Add option
                </button>
              )}
            </div>
            <div className="space-y-2">
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  {/* Correct answer selector */}
                  <button type="button" onClick={() => setForm(p => ({ ...p, correctIdx: i }))}
                    aria-label={`Mark option ${i + 1} as correct`} aria-pressed={form.correctIdx === i}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                      ${form.correctIdx === i
                        ? 'border-green-500 bg-green-500'
                        : 'border-gray-300 dark:border-gray-600 hover:border-green-400'}`}>
                    {form.correctIdx === i && <Check className="h-3.5 w-3.5 text-white" />}
                  </button>
                  <input value={opt.text} readOnly={isTF} aria-label={`Option ${i + 1}`}
                    onChange={e => {
                      const opts = [...form.options];
                      opts[i] = { text: e.target.value };
                      setForm(p => ({ ...p, options: opts }));
                    }}
                    placeholder={`Option ${i + 1}${i === form.correctIdx ? ' (correct)' : ''}`}
                    className={`${inp} flex-1 ${form.correctIdx === i ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/10' : ''}`} />
                  {!isTF && form.options.length > 2 && (
                    <button type="button" onClick={() => removeOption(i)} aria-label={`Remove option ${i + 1}`}
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
              <input type="number" min="0" max="100" value={form.points}
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
            className="flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60">
            {saving ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {initial ? 'Save changes' : 'Add question'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Bulk Import Modal ───────────────────────────────────────────────────── */
const BULK_EXAMPLE = JSON.stringify([
  {
    type: 'single',
    text: 'What is 2 + 2?',
    options: [
      { text: '3', isCorrect: false },
      { text: '4', isCorrect: true },
      { text: '5', isCorrect: false }
    ],
    points: 1,
    explanation: 'Basic arithmetic.'
  },
  {
    type: 'truefalse',
    text: 'The Earth orbits the Sun.',
    options: [
      { text: 'True', isCorrect: true },
      { text: 'False', isCorrect: false }
    ]
  }
], null, 2);

const BulkImportModal = ({ onClose, onImport }) => {
  const [text,      setText]      = useState('');
  const [loading,   setLoading]   = useState(false);
  const [rowErrors, setRowErrors] = useState([]);
  const EXAMPLE = BULK_EXAMPLE;

  const handleImport = async () => {
    let questions;
    try { questions = JSON.parse(text); }
    catch { toast.error('Invalid JSON — check the format'); return; }
    if (!Array.isArray(questions) || questions.length === 0) {
      toast.error('Paste a non-empty JSON array of questions'); return;
    }
    setLoading(true);
    setRowErrors([]);
    try {
      const result = await onImport(questions);
      if (result?.ok) onClose();
      else setRowErrors(result?.errors || []);
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
          <button onClick={onClose} title="Close" aria-label="Close dialog" className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">JSON input</label>
              <button type="button" onClick={() => setText(EXAMPLE)}
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline">
                Load example
              </button>
            </div>
            <textarea rows={16} value={text} onChange={e => setText(e.target.value)}
              placeholder={EXAMPLE} spellCheck={false}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-xs font-mono text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Each object needs <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">text</code>,{' '}
            <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">options[]</code> (each with <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">text</code> + <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">isCorrect</code>).
            Optional: <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">type</code> (<code className="font-mono">single</code> or <code className="font-mono">truefalse</code>; default single), <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">points</code> (0–100), <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">explanation</code>.
            Each question needs 2–10 options with exactly one marked correct. Nothing is imported unless every row is valid.
          </p>
          {rowErrors.length > 0 && (
            <div role="alert" className="rounded-lg border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/10 p-3 text-xs text-red-700 dark:text-red-400 space-y-1 max-h-40 overflow-y-auto">
              <p className="font-semibold">Fix these rows and import again:</p>
              {rowErrors.map(e => (
                <p key={e.index}>Row {e.row}: {e.messages.join('; ')}</p>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
          <button onClick={handleImport} disabled={loading || !text.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg disabled:opacity-60">
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
  const [confirmDelete, setConfirmDelete] = useState(null);
  const dragItem     = useRef(null);
  const dragOverItem = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const [qr, qqr] = await Promise.all([
        api.get(`/quizzes/${quizId}`),
        api.get(`/questions/quiz/${quizId}?withAnswers=true`),
      ]);
      setQuiz(qr.data.quiz);
      setQuestions(qqr.data.questions || []);
      setError(null);
    } catch (err) { setError(err.response?.data?.message || 'Failed to load quiz data.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [quizId]);

  const handleSave = async (data) => {
    try {
      if (editing) {
        await api.put(`/questions/${editing._id}`, data);
        toast.success('Question updated');
      } else {
        await api.post('/questions', data);
        toast.success('Question added');
      }
      setModal(null); setEditing(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
  };

  // Returns { ok } so the import dialog can stay open and list the rows that need fixing
  const handleBulkImport = async (questions) => {
    try {
      const { data } = await api.post('/questions/bulk', { quizId, questions });
      toast.success(data?.message || `${questions.length} questions imported`);
      load();
      return { ok: true };
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
      return { ok: false, errors: err.response?.data?.errors || [] };
    }
  };

  const handleDelete = async () => {
    const qid = confirmDelete?._id;
    if (!qid) return;
    setDeleting(qid);
    try {
      await api.delete(`/questions/${qid}`);
      toast.success('Question deleted');
      setQuestions(p => p.filter(q => q._id !== qid));
      setConfirmDelete(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
    finally { setDeleting(null); }
  };

  const handleDragEnd = async () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const from = dragItem.current, to = dragOverItem.current;
    dragItem.current = null; dragOverItem.current = null;
    if (from === to) return;
    const previous = questions;
    const arr = [...questions];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    setQuestions(arr);
    try {
      await api.put(`/admin/quizzes/${quizId}/questions/order`, { questionIds: arr.map(q => q._id) });
    } catch (err) {
      setQuestions(previous);
      toast.error(err.response?.data?.message || 'Failed to save order');
    }
  };

  if (loading) return <Page width="md"><Spinner label="Loading questions" /></Page>;
  if (error)   return (
    <Page width="md">
      <ErrorState message={error} onRetry={load} />
    </Page>
  );

  return (
    <>
      <Page width="md">

          <PageHeader
            back={{ to: '/admin/quizzes', label: 'Quizzes' }}
            title={quiz?.title}
            description={`${questions.length} question${questions.length !== 1 ? 's' : ''} · drag rows to reorder`}
            actions={
              <>
                <Button variant="secondary" icon={Upload} onClick={() => setModal('import')}>Bulk import</Button>
                <Button icon={Plus} onClick={() => { setEditing(null); setModal('add'); }}>Add question</Button>
              </>
            }
          />

          {/* Questions list */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-card overflow-hidden">
            {questions.length === 0 ? (
              <EmptyState
                icon={HelpCircle}
                title="No questions yet."
                action={<Button icon={Plus} onClick={() => setModal('add')}>Add first question</Button>}
              />
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
                        <Badge className="ml-2 align-middle">{typeLabel(q.type)}</Badge>
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
                      <button onClick={() => { setEditing(q); setModal('edit'); }} title="Edit question" aria-label="Edit question"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => setConfirmDelete(q)} disabled={deleting === q._id} title="Delete question" aria-label="Delete question"
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
              Total: {questions.reduce((s, q) => s + (q.points ?? 1), 0)} points across {questions.length} questions
            </p>
          )}
      </Page>

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
          onClose={() => setModal(null)}
          onImport={handleBulkImport}
        />
      )}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete this question?"
        message={confirmDelete ? `"${confirmDelete.text.slice(0, 120)}" will be removed from this quiz.` : ''}
        confirmLabel="Delete question"
        busy={!!deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </>
  );
};

export default ManageQuestions;
