import React from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import Logo from './Logo';

const PLANS = [
  {
    name:  'Free',
    price: null,
    desc:  'Get started at no cost. Perfect for small groups or trying things out.',
    limits: ['25 students', '10 quizzes', '3 batches', 'Invite-code join', 'Basic analytics'],
    cta:   'Start free',
    to:    '/register',
    highlight: false,
  },
  {
    name:  'Basic',
    price: '₹1,999',
    period: '/month',
    desc:  'For growing tuition centres that need more capacity and better analytics.',
    limits: ['150 students', 'Unlimited quizzes', '10 batches', 'Advanced analytics', 'Announcements', 'CSV student import'],
    cta:   'Get Basic',
    to:    '/register',
    highlight: true,
    badge: 'Most popular',
  },
  {
    name:  'Pro',
    price: '₹4,999',
    period: '/month',
    desc:  'For institutes and corporate teams that need full control and branding.',
    limits: ['500 students', 'Unlimited everything', 'Custom brand colour', 'Priority support', 'Certificate templates', 'Scheduled exams with expiry'],
    cta:   'Get Pro',
    to:    '/register',
    highlight: false,
  },
  {
    name:  'Enterprise',
    price: 'Custom',
    desc:  'For large universities, coaching chains, or companies with specific needs.',
    limits: ['Unlimited students', 'White-labelling', 'SSO / SAML', 'Dedicated onboarding', 'SLA guarantee', 'API access'],
    cta:   'Contact us',
    to:    '/contact',
    highlight: false,
  },
];

export const PricingSection = () => (
  <section className="max-w-5xl mx-auto px-6 py-16">
    <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-2 tracking-wide uppercase text-center">Pricing</p>
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 text-center">Simple, transparent pricing</h2>
    <p className="text-gray-500 dark:text-gray-400 text-center mb-10">No hidden fees. Cancel any time.</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {PLANS.map(plan => (
        <div
          key={plan.name}
          className={`flex flex-col rounded-xl border p-6 ${
            plan.highlight
              ? 'border-indigo-600 ring-2 ring-indigo-600/20 bg-white dark:bg-gray-900'
              : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
          }`}
        >
          {plan.badge && (
            <span className="inline-block self-start px-2.5 py-0.5 text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full mb-3">
              {plan.badge}
            </span>
          )}
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h2>
          <div className="mt-2 mb-4">
            {plan.price ? (
              <p className="text-3xl font-extrabold text-gray-900 dark:text-white">
                {plan.price}
                {plan.period && <span className="text-sm font-normal text-gray-400">{plan.period}</span>}
              </p>
            ) : (
              <p className="text-3xl font-extrabold text-gray-900 dark:text-white">Free</p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{plan.desc}</p>
          </div>
          <ul className="space-y-2 flex-1 mb-6">
            {plan.limits.map(l => (
              <li key={l} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Check className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                {l}
              </li>
            ))}
          </ul>
          <Link
            to={plan.to}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              plan.highlight
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
            }`}
          >
            {plan.cta} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ))}
    </div>
  </section>
);

const Pricing = () => (
  <div className="min-h-screen bg-white dark:bg-gray-950">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">

      {/* Header */}
      <div className="text-center mb-16">
        <Logo size={40} className="mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          One platform for tuition centres, schools, and training teams.
          Start free, scale when you're ready.
        </p>
      </div>

      <PricingSection />

      {/* FAQ strip */}
      <div className="mt-20 border-t border-gray-100 dark:border-gray-800 pt-16">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">Common questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {[
            { q: 'Can I upgrade or downgrade anytime?',     a: 'Yes. You can switch plans from your organisation settings. Upgrades take effect immediately; downgrades at the end of the billing period.' },
            { q: 'What happens if I exceed student limits?', a: 'New students will be unable to join until you upgrade. Existing students and their data are never removed.' },
            { q: 'Do students need to pay?',                a: 'No. Students join for free using an invite code. Only the organisation admin pays for the platform.' },
            { q: 'Is there a free trial for paid plans?',   a: 'The Free plan is indefinite with no credit card required. For paid plans, contact us for a 14-day trial.' },
          ].map(item => (
            <div key={item.q}>
              <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{item.q}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default Pricing;
