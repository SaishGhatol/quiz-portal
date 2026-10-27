import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, CreditCard, ShieldCheck, ArrowRight } from 'lucide-react';
import { Page, PageHeader, Button, Spinner, ErrorState, EmptyState } from '../ui';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const loadRazorpayScript = () => new Promise((resolve) => {
  if (window.Razorpay) return resolve(true);
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});

const FEATURES = {
  basic: ['150 students', 'Unlimited quizzes', '10 batches', 'Advanced analytics', 'Announcements', 'CSV student import'],
  pro:   ['500 students', 'Unlimited everything', 'Custom brand colour', 'Priority support', 'Certificate templates', 'Scheduled exams with expiry'],
};

const Billing = () => {
  const [org, setOrg]         = useState(null);
  const [plans, setPlans]     = useState(null);
  const [history, setHistory] = useState([]);
  const [cycle, setCycle]     = useState('monthly');
  const [paying, setPaying]   = useState(null); // plan key currently being purchased
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/org/me'),
      api.get('/billing/plans'),
      api.get('/billing/history'),
    ])
      .then(([o, p, h]) => {
        setOrg(o.data.org);
        setPlans(p.data.plans);
        setHistory(h.data.payments || []);
      })
      .catch(() => toast.error('Could not load billing details'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const upgrade = async (planKey) => {
    setPaying(planKey);
    try {
      const scriptOk = await loadRazorpayScript();
      if (!scriptOk) { toast.error('Could not load payment gateway. Check your connection.'); return; }

      const { data } = await api.post('/billing/create-order', { plan: planKey, cycle });

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'ExamVault',
        description: `${planKey[0].toUpperCase()}${planKey.slice(1)} plan — ${cycle}`,
        order_id: data.orderId,
        prefill: { name: data.orgName },
        theme: { color: '#0b847c' },
        handler: async (response) => {
          try {
            await api.post('/billing/verify', response);
            toast.success('Payment successful — plan upgraded!');
            load();
          } catch {
            toast.error('Payment received but verification failed. Contact support with your payment ID.');
          }
        },
        modal: { ondismiss: () => setPaying(null) },
      });
      rzp.on('payment.failed', () => toast.error('Payment failed. Please try again.'));
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start checkout');
    } finally {
      setPaying(null);
    }
  };

  if (loading) return <Page><Spinner label="Loading billing" /></Page>;
  if (!org)    return <Page><ErrorState title="Could not load organisation." /></Page>;

  const expiryLabel = org.planExpiry
    ? new Date(org.planExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <Page className="space-y-8">

        <PageHeader
          title="Billing & Plan"
          description={
            <>
              Currently on the <span className="font-semibold capitalize text-gray-700 dark:text-gray-300">{org.plan}</span> plan
              {expiryLabel && org.plan !== 'free' && <> · renews/expires {expiryLabel}</>}
            </>
          }
        />

        {/* Billing cycle toggle */}
        <div className="flex items-center gap-3">
          <div className="inline-flex bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
            {['monthly', 'yearly'].map(c => (
              <button key={c} onClick={() => setCycle(c)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  cycle === c ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
                }`}>
                {c === 'monthly' ? 'Monthly' : 'Yearly (2 months free)'}
              </button>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {['basic', 'pro'].map(key => {
            const p = plans[key];
            const price = cycle === 'yearly' ? p.priceYearly : p.priceMonthly;
            const isCurrent = org.plan === key;
            return (
              <div key={key} className={`flex flex-col rounded-2xl border shadow-card p-6 bg-white dark:bg-gray-900 ${
                isCurrent ? 'border-brand-600 ring-2 ring-brand-600/20' : 'border-gray-200 dark:border-gray-800'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">{p.label}</h2>
                  {isCurrent && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300">Current plan</span>}
                </div>
                <p className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
                  ₹{price.toLocaleString('en-IN')}<span className="text-sm font-normal text-gray-400">/{cycle === 'yearly' ? 'yr' : 'mo'}</span>
                </p>
                <ul className="space-y-2 flex-1 mb-6">
                  {FEATURES[key].map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Check className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => upgrade(key)}
                  icon={CreditCard}
                  loading={paying === key}
                  disabled={isCurrent}
                  fullWidth
                >
                  {isCurrent ? 'Current plan' : `Pay with Razorpay`}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Enterprise callout */}
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-card bg-white dark:bg-gray-900 p-5">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Need white-labelling, SSO, or 500+ students?</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Talk to us about the Enterprise plan.</p>
          </div>
          <Link to="/contact" className="shrink-0 flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline">
            Contact sales <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Payment history */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Payment history</p>
          {history.length === 0 ? (
            <EmptyState
              compact
              className="border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl"
              icon={CreditCard}
              title="No payments yet."
            />
          ) : (
            <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-400 uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-5 py-3">Date</th>
                    <th className="text-left px-5 py-3">Plan</th>
                    <th className="text-left px-5 py-3">Amount</th>
                    <th className="text-left px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {history.map(h => (
                    <tr key={h._id}>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{new Date(h.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="px-5 py-3 capitalize text-gray-900 dark:text-white font-medium">{h.plan} · {h.cycle}</td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300">₹{h.amount.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                          h.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : h.status === 'failed'
                            ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {h.status === 'paid' && <ShieldCheck className="h-3 w-3" />} {h.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

    </Page>
  );
};

export default Billing;
