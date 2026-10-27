import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import AuthContext from '../../contexts/AuthContext';
import QuizCard from './QuizCard';
import SkeletonBlock, { QuizGridSkeleton } from '../Skeleton';
import { Search, Shuffle, X, SearchX, LayoutGrid, Bookmark } from 'lucide-react';
import { Button, Tabs, EmptyState, ErrorState, PageHeader } from '../ui';
import { CATEGORIES, categoryMeta, bestByQuiz } from '../../utils/quiz';

const DIFFICULTIES = [
  { value: '',       label: 'All levels' },
  { value: 'easy',   label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard',   label: 'Hard' },
];

// URL value → server sort params (the API already supports sortBy/order)
const SORTS = {
  new:     { label: 'Newest',         sortBy: 'createdAt',     order: 'desc' },
  popular: { label: 'Most attempted', sortBy: 'totalAttempts', order: 'desc' },
  short:   { label: 'Shortest first', sortBy: 'timeLimit',     order: 'asc' },
};

const QuizList = () => {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();

  const [quizzes, setQuizzes] = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [best,    setBest]    = useState({});
  const [saved,   setSaved]   = useState([]);   // the user's saved quizzes

  const q    = searchParams.get('search')     || '';
  const cat  = searchParams.get('category')   || '';
  const savedView = searchParams.get('view') === 'saved';
  const diff = searchParams.get('difficulty') || '';
  const sort = SORTS[searchParams.get('sort')] ? searchParams.get('sort') : 'new';

  const set = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set(key, val); else next.delete(key);
    setSearchParams(next, { replace: key === 'search' });
  };

  const hasFilters = !!(q || cat || diff);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (q)    params.set('search', q);
      if (cat)  params.set('category', cat);
      if (diff) params.set('difficulty', diff);
      params.set('sortBy', SORTS[sort].sortBy);
      params.set('order', SORTS[sort].order);
      const res = await api.get(`/quizzes?${params}`);
      setQuizzes(res.data.quizzes || []);
      setTotal(res.data.total ?? (res.data.quizzes?.length || 0));
    } catch { setError('Could not load quizzes. Check your connection and try again.'); }
    finally   { setLoading(false); }
  }, [q, cat, diff, sort]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  // Best score per quiz, so cards can show "Your best" — optional, so failures are ignored
  useEffect(() => {
    if (!currentUser) return;
    api.get('/quizzes/my-attempts')
      .then(r => setBest(bestByQuiz(r.data.attempts || [])))
      .catch(() => {});
    api.get('/users/me/saved')
      .then(r => setSaved(r.data.quizzes || []))
      .catch(() => {});
  }, [currentUser]);

  const savedIds = new Set(saved.map(s => s._id));
  // The Saved view filters the saved list with the same search/topic/level controls
  const visible = savedView
    ? saved.filter(s => (!q || `${s.title} ${s.description}`.toLowerCase().includes(q.toLowerCase()))
        && (!cat || s.category === cat) && (!diff || s.difficulty === diff))
    : quizzes;

  const randomQuiz = () => {
    if (quizzes.length) navigate(`/quiz/${quizzes[Math.floor(Math.random() * quizzes.length)]._id}`);
  };

  const chip = (active) =>
    `inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-sm font-medium whitespace-nowrap ${
      active
        ? 'bg-gray-900 dark:bg-white border-gray-900 dark:border-white text-white dark:text-gray-900'
        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
    }`;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        <PageHeader
          title="Explore quizzes"
          description="Pick a topic, set your level and start practising. Your best score on each quiz is saved."
          actions={
            <Button variant="secondary" icon={Shuffle} onClick={randomQuiz} disabled={loading || !quizzes.length}>
              Surprise me
            </Button>
          }
        />

        {/* ── Toolbar ── */}
        <div className="space-y-4 mb-8">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" aria-hidden="true" />
              <label htmlFor="quiz-search" className="sr-only">Search quizzes</label>
              <input
                id="quiz-search"
                type="search"
                placeholder="Search by title or topic…"
                value={q}
                onChange={e => set('search', e.target.value)}
                className="w-full h-11 pl-10 pr-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 shadow-card focus:outline-none focus:ring-4 focus:ring-brand-500/15 focus:border-brand-500 [&::-webkit-search-cancel-button]:hidden"
              />
              {q && (
                <button type="button" onClick={() => set('search', '')} aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Tabs label="Difficulty" options={DIFFICULTIES} value={diff} onChange={v => set('difficulty', v)} />
              <div className="relative">
                <label htmlFor="quiz-sort" className="sr-only">Sort quizzes</label>
                <select id="quiz-sort" value={sort} onChange={e => set('sort', e.target.value === 'new' ? '' : e.target.value)}
                  className="h-11 w-full sm:w-auto pl-3.5 pr-9 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 shadow-card focus:outline-none focus:ring-4 focus:ring-brand-500/15 focus:border-brand-500 appearance-none cursor-pointer">
                  {Object.entries(SORTS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
                </select>
                <svg aria-hidden="true" className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
              </div>
            </div>
          </div>

          {/* Category chips — scroll sideways on small screens */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap" role="group" aria-label="Category">
            {currentUser && (
              <button type="button" onClick={() => set('view', savedView ? '' : 'saved')} aria-pressed={savedView} className={chip(savedView)}>
                <Bookmark className="h-4 w-4" aria-hidden="true" /> Saved{saved.length > 0 && ` (${saved.length})`}
              </button>
            )}
            <button type="button" onClick={() => set('category', '')} aria-pressed={!cat} className={chip(!cat)}>
              <LayoutGrid className="h-4 w-4" aria-hidden="true" /> All topics
            </button>
            {CATEGORIES.map(c => {
              const { icon: Icon } = categoryMeta(c);
              return (
                <button key={c} type="button" onClick={() => set('category', cat === c ? '' : c)} aria-pressed={cat === c} className={chip(cat === c)}>
                  <Icon className="h-4 w-4" aria-hidden="true" /> {c}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3 min-h-8">
            <p className="text-sm text-gray-500 dark:text-gray-400" aria-live="polite">
              {savedView
                ? `${visible.length} saved quiz${visible.length !== 1 ? 'zes' : ''}`
                : loading ? 'Loading quizzes…' : `${total} quiz${total !== 1 ? 'zes' : ''}${hasFilters ? ' match your filters' : ' available'}`}
            </p>
            {hasFilters && (
              <Button variant="ghost" size="sm" icon={X} onClick={() => setSearchParams(sort === 'new' ? {} : { sort })}>Clear filters</Button>
            )}
          </div>
        </div>

        {/* ── Content ── */}
        {savedView && visible.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title={saved.length ? 'No saved quizzes match those filters' : 'Nothing saved yet'}
            description={saved.length ? 'Try a different topic or search term.' : 'Open any quiz and press Save to keep it here for later.'}
            action={<Button variant="secondary" onClick={() => set('view', '')}>Browse all quizzes</Button>}
          />
        ) : !savedView && loading ? (
          <SkeletonBlock label="Loading quizzes">
            <QuizGridSkeleton />
          </SkeletonBlock>
        ) : !savedView && error ? (
          <ErrorState title="Couldn't load quizzes" message={error} onRetry={load} />
        ) : !savedView && quizzes.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title={hasFilters ? 'No quizzes match those filters' : 'No quizzes yet'}
            description={hasFilters ? 'Try a different topic, level or search term.' : 'Check back soon — new quizzes are added regularly.'}
            action={hasFilters && <Button variant="secondary" onClick={() => setSearchParams({})}>Clear filters</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visible.map(quiz => <QuizCard key={quiz._id} quiz={quiz} best={best[quiz._id]} saved={savedIds.has(quiz._id)} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizList;
