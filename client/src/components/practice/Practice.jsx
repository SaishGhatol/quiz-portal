import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import { Button, Card, ProgressBar, ErrorState, EmptyState, Spinner, Badge } from '../ui';
import {
  ArrowLeft, ArrowRight, Check, X, Lightbulb, RotateCcw, Target, Dumbbell, NotebookPen, Play, PartyPopper,
} from 'lucide-react';

const LETTERS = 'ABCDEFGHIJ';

/**
 * Practice mode: one question at a time, instant feedback, no timer, nothing recorded.
 * /practice/:id       — practise a quiz
 * /practice/mistakes  — drill the questions from your mistake notebook
 */
const Practice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMistakes = id === 'mistakes';

  const [title, setTitle] = useState('');
  const [items, setItems] = useState([]);     // [{ question, quizTitle }]
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [result, setResult] = useState(null); // { isCorrect, correctOptionId, explanation }
  const [checking, setChecking] = useState(false);
  const [score, setScore] = useState({ right: 0, answered: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isMistakes) {
        const { data } = await api.get('/practice/mistakes');
        setTitle('Mistake drill');
        setItems(data.mistakes.map(m => ({ question: m.question, quizTitle: m.quiz.title })));
      } else {
        const { data } = await api.get(`/practice/quizzes/${id}`);
        setTitle(data.quiz.title);
        setItems(data.questions.map(q => ({ question: q, quizTitle: data.quiz.title })));
      }
      setIndex(0); setPicked(null); setResult(null); setScore({ right: 0, answered: 0 });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load practice questions.');
    } finally {
      setLoading(false);
    }
  }, [id, isMistakes]);

  useEffect(() => { load(); }, [load]);

  const current = items[index];
  const finished = items.length > 0 && index >= items.length;

  const choose = useCallback(async optionId => {
    if (!current || result || checking) return;
    setPicked(optionId);
    setChecking(true);
    try {
      const { data } = await api.post('/practice/check', { questionId: current.question._id, selectedOptionId: optionId });
      setResult(data);
      setScore(s => ({ right: s.right + (data.isCorrect ? 1 : 0), answered: s.answered + 1 }));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not check that answer.');
    } finally {
      setChecking(false);
    }
  }, [current, result, checking]);

  const next = useCallback(() => {
    setIndex(i => i + 1);
    setPicked(null);
    setResult(null);
  }, []);

  // A–D / 1–9 answer, Enter moves on once the answer is checked
  useEffect(() => {
    const onKey = e => {
      if (e.ctrlKey || e.metaKey || e.altKey || !current) return;
      const key = e.key.toUpperCase();
      if (result && (e.key === 'Enter' || e.key === 'ArrowRight')) { e.preventDefault(); next(); return; }
      let idx = -1;
      if (/^[1-9]$/.test(key)) idx = Number(key) - 1;
      else if (key.length === 1 && LETTERS.includes(key)) idx = LETTERS.indexOf(key);
      if (idx >= 0 && idx < current.question.options.length) choose(current.question.options[idx]._id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, result, choose, next]);

  const shell = children => (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">{children}</div>
    </div>
  );

  if (loading) return shell(<Spinner label="Getting your practice ready" />);

  if (error && !items.length) return shell(
    <Card>
      <ErrorState title="Practice isn't available" message={error}
        onRetry={error.startsWith('Could not') ? load : undefined}
        action={<Button variant="ghost" icon={ArrowLeft} onClick={() => navigate(-1)}>Go back</Button>} />
    </Card>
  );

  if (!items.length) return shell(
    <Card>
      <EmptyState icon={PartyPopper} title={isMistakes ? 'No mistakes to drill' : 'No questions yet'}
        description={isMistakes ? 'Every question you have missed is fixed. Take a new quiz to keep the streak going.' : 'This quiz has no questions to practise.'}
        action={<Button to="/quizzes" icon={ArrowRight}>Explore quizzes</Button>} />
    </Card>
  );

  if (finished) {
    const pct = Math.round((score.right / Math.max(score.answered, 1)) * 100);
    return shell(
      <Card className="text-center sm:p-10 animate-fade-up">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-300 flex items-center justify-center mx-auto mb-4">
          <Target className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Practice complete</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          You got <span className="font-semibold text-gray-900 dark:text-white">{score.right} of {score.answered}</span> right ({pct}%).
          {isMistakes && score.right > 0 && ' Fixed questions have left your notebook.'}
        </p>
        <p className="text-xs text-gray-400 mt-2">Practice runs aren't scored or added to the leaderboard.</p>
        <div className="mt-7 flex flex-col sm:flex-row gap-2 justify-center">
          <Button icon={RotateCcw} onClick={load}>{isMistakes ? 'Drill remaining mistakes' : 'Practise again'}</Button>
          {!isMistakes && <Button variant="secondary" icon={Play} to={`/quiz/${id}`}>Take the real quiz</Button>}
          <Button variant="secondary" icon={NotebookPen} to="/mistakes">Mistake notebook</Button>
        </div>
      </Card>
    );
  }

  const { question } = current;
  return shell(
    <>
      <div className="flex items-center justify-between gap-3 mb-5">
        <Link to={isMistakes ? '/mistakes' : `/quiz/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {isMistakes ? 'Mistake notebook' : 'Quiz details'}
        </Link>
        <Badge tone="brand" icon={Dumbbell}>Practice · not scored</Badge>
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between gap-3 text-sm mb-2">
          <p className="font-semibold text-gray-900 dark:text-white truncate">{title}</p>
          <p className="text-gray-500 dark:text-gray-400 tabular-nums shrink-0">{score.right}/{score.answered} correct</p>
        </div>
        <ProgressBar value={index} max={items.length} label="Practice progress" />
      </div>

      <Card className="sm:p-8 animate-fade-in" key={question._id}>
        <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-2">
          Question {index + 1} <span className="text-gray-400">of {items.length}</span>
          {isMistakes && <span className="normal-case tracking-normal font-medium text-gray-400"> · {current.quizTitle}</span>}
        </p>
        <h2 id="practice-question" className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white leading-relaxed whitespace-pre-line">{question.text}</h2>

        <div role="radiogroup" aria-labelledby="practice-question" className="mt-6 space-y-3">
          {question.options.map((o, i) => {
            const isPicked = picked === o._id;
            const isRight = result && String(result.correctOptionId) === String(o._id);
            const isWrongPick = result && isPicked && !result.isCorrect;
            return (
              <button key={o._id} type="button" role="radio" aria-checked={isPicked} disabled={!!result || checking}
                onClick={() => choose(o._id)}
                className={`w-full text-left px-4 py-3.5 rounded-xl border-2 flex items-center gap-3.5 text-[15px] disabled:cursor-default ${
                  isRight ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-gray-900 dark:text-white'
                  : isWrongPick ? 'border-red-400 bg-red-50 dark:bg-red-500/10 text-gray-900 dark:text-white'
                  : isPicked ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-500/10'
                  : result ? 'border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-500'
                  : 'border-gray-200 dark:border-gray-700/80 text-gray-700 dark:text-gray-300 hover:border-brand-200 dark:hover:border-brand-500/40 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}>
                <span className={`w-8 h-8 rounded-lg border flex items-center justify-center text-sm font-bold shrink-0 ${
                  isRight ? 'bg-emerald-600 border-emerald-600 text-white'
                  : isWrongPick ? 'bg-red-500 border-red-500 text-white'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {isRight ? <Check className="h-4 w-4" aria-hidden="true" /> : isWrongPick ? <X className="h-4 w-4" aria-hidden="true" /> : LETTERS[i]}
                </span>
                <span className="flex-1">{o.text}</span>
              </button>
            );
          })}
        </div>

        {result && (
          <div role="status" className={`mt-6 rounded-xl p-4 animate-fade-in ${
            result.isCorrect ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-200' : 'bg-red-50 dark:bg-red-500/10 text-red-900 dark:text-red-200'
          }`}>
            <p className="font-semibold">{result.isCorrect ? 'Correct!' : 'Not quite.'}</p>
            {result.explanation
              ? <p className="text-sm mt-1 flex gap-2"><Lightbulb className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />{result.explanation}</p>
              : !result.isCorrect && <p className="text-sm mt-1">The correct answer is highlighted in green.</p>}
          </div>
        )}
        {error && <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex items-center justify-between gap-3 mt-7 pt-6 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-400 hidden sm:block">
            <kbd className="kbd">A–D</kbd> answer · <kbd className="kbd">Enter</kbd> next
          </p>
          <Button className="ml-auto" iconRight={ArrowRight} onClick={next} disabled={!result}>
            {index === items.length - 1 ? 'See results' : 'Next question'}
          </Button>
        </div>
      </Card>
    </>
  );
};

export default Practice;
