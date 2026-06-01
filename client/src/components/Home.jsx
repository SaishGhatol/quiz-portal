import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../contexts/AuthContext';
import { ArrowRight, BookOpen, Trophy, LayoutDashboard, Settings, Layers, Quote } from 'lucide-react';
import api from '../utils/api';
import { PricingSection } from './Pricing';

const AVATAR_COLORS = [
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300',
  'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300',
];

const initials = name =>
  name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

const FALLBACK_REVIEWS = [
  {
    _id: 'f1',
    name: 'Priya Mehta',
    role: 'B.Sc. Computer Science, Year 2',
    quote: 'The instant feedback after each quiz helped me pinpoint exactly where I was going wrong. My exam scores improved within two weeks.',
  },
  {
    _id: 'f2',
    name: 'James Okafor',
    role: 'High School Science Teacher',
    quote: 'I set up a timed quiz for my class in under five minutes. The live leaderboard kept every student engaged right to the end.',
  },
  {
    _id: 'f3',
    name: 'Sarah Lin',
    role: 'L&D Manager, FinTech firm',
    quote: 'We replaced our old paper-based onboarding tests overnight. Completion rates went up 40% and managers finally have real data.',
  },
];

const Home = () => {
  const { currentUser, isAdmin, isOrgAdmin } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    api.get('/quizzes/stats').then(r => setStats(r.data)).catch(() => {});
    api.get('/reviews').then(r => setReviews(r.data)).catch(() => {});
  }, []);

  const actions = [
    {
      title: 'Take a Quiz',
      desc: 'Browse quizzes by category and difficulty. Start where you like.',
      icon: BookOpen,
      to: '/quizzes',
      cta: 'Explore quizzes',
    },
    {
      title: 'Leaderboard',
      desc: 'See the top scorers on the platform and where you rank.',
      icon: Trophy,
      to: '/leaderboard',
      cta: 'View leaderboard',
    },
    {
      title: currentUser ? 'My Dashboard' : 'Get started',
      desc: currentUser
        ? 'View your recent attempts, scores, and progress.'
        : 'Create a free account to track progress and earn certificates.',
      icon: LayoutDashboard,
      to: currentUser ? '/dashboard' : '/register',
      cta: currentUser ? 'Open dashboard' : 'Create account',
    },
    // Students in an org → My Classes
    ...(currentUser?.orgId && !isOrgAdmin ? [{
      title: 'My Classes',
      desc: 'See quizzes assigned to you by your teacher and track your class progress.',
      icon: Layers,
      to: '/my-classes',
      cta: 'View my classes',
    }] : []),
    // Org admin → org dashboard
    ...(isOrgAdmin ? [{
      title: 'My Organisation',
      desc: 'Manage batches, students, assignments, and view analytics.',
      icon: Settings,
      to: '/org',
      cta: 'Open dashboard',
    }] : []),
  ];

  if (isAdmin) {
    actions.push({
      title: 'Admin Panel',
      desc: 'Manage quizzes, users, and platform-wide analytics.',
      icon: Settings,
      to: '/admin',
      cta: 'Open admin',
    });
  }

  return (
    <div className="bg-white dark:bg-gray-950">

      {/* ── Hero ── */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-4 tracking-wide uppercase">
          ExamVault
        </p>
        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white leading-tight tracking-tight mb-5">
          Test your knowledge.<br />Track your progress.
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto mb-8 leading-relaxed">
          A quiz platform for students, training teams, and educators.
          Take quizzes, compare scores, and earn certificates.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {currentUser ? (
            <Link
              to="/quizzes"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
            >
              Browse quizzes <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
              >
                Get started free
              </Link>
              <Link
                to="/quizzes"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold rounded-lg transition-colors"
              >
                Browse quizzes
              </Link>
            </>
          )}
        </div>

        {/* Live stats — only shown once loaded */}
        {stats && (
          <div className="mt-10 flex justify-center gap-8 text-sm text-gray-400 dark:text-gray-500">
            <span><strong className="text-gray-700 dark:text-gray-300">{stats.totalQuizzes}</strong> quizzes</span>
            <span><strong className="text-gray-700 dark:text-gray-300">{stats.totalUsers}</strong> users</span>
            <span><strong className="text-gray-700 dark:text-gray-300">{stats.totalAttempts}</strong> attempts</span>
          </div>
        )}
      </section>

      {/* ── Divider ── */}
      <div className="border-t border-gray-100 dark:border-gray-800" />

      {/* ── Action cards ── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${actions.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
          {actions.map((a, i) => (
            <Link
              key={i}
              to={a.to}
              className="group flex flex-col gap-4 p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/30 dark:hover:bg-blue-900/10 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <a.icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white mb-1">{a.title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{a.desc}</p>
              </div>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 group-hover:gap-2 transition-all">
                {a.cta} <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="border-t border-gray-100 dark:border-gray-800" />

      {/* ── Who it's for ── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Who it's for</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { heading: 'Students', text: 'Practice for exams, track your weak areas, and see how you compare with others.' },
            { heading: 'Educators', text: 'Create and publish quizzes, monitor student performance, and issue certificates.' },
            { heading: 'Organisations', text: 'Run assessments for onboarding, training programmes, or internal certification.' },
          ].map((item, i) => (
            <div key={i} className="border-l-2 border-indigo-600 pl-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{item.heading}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <div className="border-t border-gray-100 dark:border-gray-800" />
      <section className="max-w-5xl mx-auto px-6 py-16">
        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-2 tracking-wide uppercase text-center">What people say</p>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-10 text-center">Loved by students, educators & teams</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {(reviews.length > 0 ? reviews : FALLBACK_REVIEWS).map((r, i) => (
            <div
              key={r._id}
              className="flex flex-col gap-4 p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl"
            >
              <Quote className="h-5 w-5 text-indigo-300 dark:text-indigo-700 shrink-0" />
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed flex-1">"{r.quote}"</p>
              <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                <span className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                  {initials(r.name)}
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{r.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{r.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <div className="border-t border-gray-100 dark:border-gray-800" />
      <PricingSection />

      {/* ── CTA (only for unauthenticated visitors) ── */}
      {!currentUser && (
        <>
          <div className="border-t border-gray-100 dark:border-gray-800" />
          <section className="max-w-2xl mx-auto px-6 py-16 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Ready to start?
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Free to use. No credit card required.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
            >
              Create your free account <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        </>
      )}
    </div>
  );
};

export default Home;
