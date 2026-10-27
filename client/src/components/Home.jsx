import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../contexts/AuthContext';
import {
  ArrowRight, BookOpen, Trophy, LayoutDashboard, Settings, Layers, Quote, Building2, Search,
  Timer, ListChecks, LineChart, Award, Users, Flame,
} from 'lucide-react';
import api from '../utils/api';
import { PricingSection } from './Pricing';
import { Button, Card, DifficultyBadge, Avatar } from './ui';
import { CATEGORIES, categoryMeta } from '../utils/quiz';

const FEATURES = [
  { icon: Timer,      title: 'Timed practice',        text: 'Exam-style quizzes with a live timer and a question palette, so practice feels like the real thing.' },
  { icon: ListChecks, title: 'Instant review',        text: 'See your score the moment you submit, then walk through every question and the correct answer.' },
  { icon: LineChart,  title: 'Progress you can see',  text: 'Score trends, category strengths and your weakest topics — all built from your own attempts.' },
  { icon: Trophy,     title: 'Leaderboards',          text: 'Compare your best scores with everyone else, ranked by accuracy and then speed.' },
  { icon: Award,      title: 'Certificates',          text: 'Pass a quiz and download a certificate you can print or save as a PDF.' },
  { icon: Users,      title: 'Classes & batches',     text: 'Join your institute with an invite code and get assignments with due dates in one place.' },
];

const STEPS = [
  'Create your institute and get a 6-character invite code to share on WhatsApp.',
  'Set up batches — e.g. "NEET 2026 Morning" — and share the code with that batch.',
  'Build a test from your own question bank or import via JSON, then assign it with a due date.',
  'Watch scores land in real time on the analytics dashboard — no manual checking.',
];

const fmt = n => (typeof n === 'number' ? n.toLocaleString() : n);

const Home = () => {
  const { currentUser, isAdmin, isOrgAdmin } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats,   setStats]   = useState(null);
  const [reviews, setReviews] = useState([]);
  const [popular, setPopular] = useState(null);
  const [query,   setQuery]   = useState('');

  useEffect(() => {
    api.get('/quizzes/stats').then(r => setStats(r.data)).catch(() => {});
    api.get('/reviews').then(r => setReviews(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    api.get('/quizzes?sortBy=totalAttempts&order=desc&limit=4')
      .then(r => setPopular(r.data.quizzes || []))
      .catch(() => setPopular([]));
  }, []);

  const onSearch = e => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/quizzes?search=${encodeURIComponent(q)}` : '/quizzes');
  };

  // Role-aware shortcuts for signed-in users
  const actions = currentUser ? [
    { title: 'My dashboard', desc: 'Recent attempts, scores and what to do next.', icon: LayoutDashboard, to: '/dashboard' },
    { title: 'Leaderboard',  desc: 'See the top scorers and where you rank.',       icon: Trophy,          to: '/leaderboard' },
    ...(!currentUser.orgId && !isAdmin ? [{
      title: 'Set up your institute', desc: 'Create an organisation, or join one with an invite code.', icon: Building2, to: '/org/setup',
    }] : []),
    ...(currentUser.orgId && !isOrgAdmin ? [{
      title: 'My classes', desc: 'Quizzes assigned by your teacher and your class progress.', icon: Layers, to: '/my-classes',
    }] : []),
    ...(isOrgAdmin ? [{
      title: 'My organisation', desc: 'Batches, students, assignments and analytics.', icon: Settings, to: '/org',
    }] : []),
    ...(isAdmin ? [{
      title: 'Admin panel', desc: 'Manage quizzes, users and platform analytics.', icon: Settings, to: '/admin',
    }] : []),
  ] : [];

  return (
    <div className="bg-white dark:bg-gray-950">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-gray-100 dark:border-gray-900">
        {/* Soft grid backdrop — decorative only */}
        <div aria-hidden="true"
          className="absolute inset-0 opacity-[0.5] dark:opacity-[0.25] pointer-events-none [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]"
          style={{ backgroundImage: 'linear-gradient(to right, rgb(148 155 171 / 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgb(148 155 171 / 0.15) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-16 sm:pb-20 grid lg:grid-cols-[1.15fr_1fr] gap-12 items-center">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-200 dark:border-brand-500/30 bg-brand-50/80 dark:bg-brand-500/10 text-xs font-semibold text-brand-700 dark:text-brand-300">
              <Flame className="h-3.5 w-3.5" aria-hidden="true" /> Practice · Compete · Improve
            </span>

            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-gray-900 dark:text-white leading-[1.08]">
              Practice smarter.<br />
              <span className="text-brand-600 dark:text-brand-400">Watch your scores climb.</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-xl leading-relaxed">
              Timed quizzes for college exams, placements and competitive tests — with instant
              review, progress tracking and leaderboards that keep you going.
            </p>

            {/* Quick search */}
            <form onSubmit={onSearch} role="search" className="mt-8 flex max-w-xl gap-2 p-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-raised">
              <label htmlFor="hero-search" className="sr-only">Search quizzes</label>
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
                <input id="hero-search" value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Search a topic, e.g. JavaScript, Algebra…"
                  className="w-full h-11 pl-10 pr-3 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none" />
              </div>
              <Button type="submit" size="md" className="h-11 px-5">Search</Button>
            </form>

            {/* Category shortcuts */}
            <div className="mt-4 flex flex-wrap gap-2">
              {CATEGORIES.map(c => {
                const { icon: Icon } = categoryMeta(c);
                return (
                  <Link key={c} to={`/quizzes?category=${encodeURIComponent(c)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 text-xs font-medium text-gray-600 dark:text-gray-300 hover:border-brand-300 dark:hover:border-brand-500/50 hover:text-brand-700 dark:hover:text-brand-300">
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {c}
                  </Link>
                );
              })}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              {currentUser ? (
                <>
                  <Button to="/dashboard" size="lg" iconRight={ArrowRight}>Go to dashboard</Button>
                  <Button to="/quizzes" size="lg" variant="secondary">Browse all quizzes</Button>
                </>
              ) : (
                <>
                  <Button to="/register" size="lg" iconRight={ArrowRight}>Start practising free</Button>
                  <Button to="/quizzes" size="lg" variant="secondary">Browse quizzes</Button>
                </>
              )}
            </div>

            {/* Live platform numbers — only rendered once loaded */}
            {stats && (
              <dl className="mt-10 grid grid-cols-3 max-w-md divide-x divide-gray-200 dark:divide-gray-800">
                {[['Quizzes', stats.totalQuizzes], ['Learners', stats.totalUsers], ['Attempts', stats.totalAttempts]].map(([label, v]) => (
                  <div key={label} className="px-4 first:pl-0">
                    <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
                    <dd className="text-xl font-bold font-display text-gray-900 dark:text-white tabular-nums">{fmt(v)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {/* Popular quizzes — real data */}
          <Card padding={false} className="animate-fade-up shadow-raised [animation-delay:80ms]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-500" aria-hidden="true" /> Popular right now
              </p>
              <Link to="/quizzes" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">See all</Link>
            </div>
            {popular === null ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800 animate-pulse" role="status" aria-label="Loading popular quizzes">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 px-5 py-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-2/3 rounded bg-gray-100 dark:bg-gray-800" />
                      <div className="h-3 w-1/3 rounded bg-gray-100 dark:bg-gray-800" />
                    </div>
                  </div>
                ))}
              </div>
            ) : popular.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <BookOpen className="h-8 w-8 text-gray-300 dark:text-gray-700 mx-auto mb-2" aria-hidden="true" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No quizzes published yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {popular.map(q => {
                  const m = categoryMeta(q.category);
                  return (
                    <li key={q._id}>
                      <Link to={`/quiz/${q._id}`} className="group flex items-center gap-3.5 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${m.cls}`}>
                          <m.icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-brand-700 dark:group-hover:text-brand-300">{q.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                            {q.category}{q.totalQuestions > 0 && ` · ${q.totalQuestions} questions`}{q.timeLimit > 0 && ` · ${q.timeLimit} min`}
                          </p>
                        </div>
                        <DifficultyBadge difficulty={q.difficulty} className="hidden sm:inline-flex" />
                        <ArrowRight className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-brand-500 shrink-0" aria-hidden="true" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </section>

      {/* ── Signed-in shortcuts ── */}
      {actions.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-14">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Jump back in</h2>
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${actions.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
            {actions.map(a => (
              <Card key={a.to} as={Link} to={a.to} interactive className="group flex items-start gap-4">
                <span className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                  <a.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                    {a.title}
                    <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{a.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ── Features for learners ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-2">Built for exam prep</p>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Everything you need to practise with purpose</h2>
          <p className="mt-3 text-gray-500 dark:text-gray-400">No clutter — just quizzes, feedback and a clear picture of where you stand.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
          {FEATURES.map(f => (
            <div key={f.title} className="flex gap-4">
              <span className="w-11 h-11 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-card text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                <f.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{f.title}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── For institutes ── */}
      <section className="bg-gray-50 dark:bg-gray-900/40 border-y border-gray-100 dark:border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 grid lg:grid-cols-[1fr_1.3fr] gap-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-2">For coaching institutes & schools</p>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Run your test series online in 10 minutes</h2>
            <p className="mt-3 text-gray-500 dark:text-gray-400 leading-relaxed">
              Batch-wise test series with negative marking, teacher-assigned tests with due dates,
              and a progress report you can show parents at PTMs.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button to={currentUser ? '/org/setup' : '/register'} icon={Building2}>Set up your institute</Button>
              <Button to="/pricing" variant="secondary">See pricing</Button>
            </div>
          </div>
          <ol className="grid sm:grid-cols-2 gap-4">
            {STEPS.map((text, i) => (
              <li key={i}>
                <Card className="h-full">
                  <span className="inline-flex w-8 h-8 items-center justify-center rounded-lg bg-brand-600 text-white text-sm font-bold font-display">{i + 1}</span>
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{text}</p>
                </Card>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Testimonials — only real reviews that an admin has approved ── */}
      {reviews.length > 0 && (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center max-w-xl mx-auto mb-12">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-2">What people say</p>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Loved by students, educators & teams</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {reviews.map(r => (
            <Card key={r._id} as="figure" className="flex flex-col gap-4">
              <Quote className="h-5 w-5 text-brand-300 dark:text-brand-600 shrink-0" aria-hidden="true" />
              <blockquote className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed flex-1">“{r.quote}”</blockquote>
              <figcaption className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <Avatar name={r.name} size="md" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{r.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{r.role}</p>
                </div>
              </figcaption>
            </Card>
          ))}
        </div>
      </section>
      )}

      {/* ── Pricing ── */}
      <div className="border-t border-gray-100 dark:border-gray-900" />
      <PricingSection />

      {/* ── CTA (only for unauthenticated visitors) ── */}
      {!currentUser && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
          <div className="rounded-3xl bg-brand-50 dark:bg-gray-900 border border-brand-100 dark:border-gray-800 px-6 sm:px-12 py-12 sm:py-14 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Your next attempt starts here</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Free to use. No credit card required.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button to="/register" size="lg" iconRight={ArrowRight}>Create free account</Button>
              <Button to="/quizzes" size="lg" variant="secondary">Browse quizzes</Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
