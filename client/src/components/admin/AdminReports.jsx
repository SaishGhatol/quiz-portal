import React, { useState } from 'react';
import api from '../../utils/api';
import { Download, Users, FileText, CheckCircle } from 'lucide-react';
import { Page, PageHeader, Button } from '../ui';
import { toast } from 'react-toastify';

const REPORTS = [
  {
    key: 'users',
    title: 'User export',
    desc: 'All registered users — name, email, role, status, join date.',
    icon: Users,
    filename: 'users',
    color: 'bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400',
  },
  {
    key: 'attempts',
    title: 'Attempts export',
    desc: 'All quiz attempts — user, quiz, score %, pass/fail, date.',
    icon: FileText,
    filename: 'attempts',
    color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
  },
];

const AdminReports = () => {
  const [busy, setBusy]   = useState({});
  const [done, setDone]   = useState({});

  const download = async (report) => {
    setBusy(p => ({ ...p, [report.key]: true }));
    setDone(p => ({ ...p, [report.key]: false }));
    try {
      const res = await api.get(`/admin/export/${report.key}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `${report.filename}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setDone(p => ({ ...p, [report.key]: true }));
      setTimeout(() => setDone(p => ({ ...p, [report.key]: false })), 3000);
    } catch {
      toast.error('Export failed. Please try again.');
    } finally {
      setBusy(p => ({ ...p, [report.key]: false }));
    }
  };

  return (
    <Page width="md" className="space-y-8">

        <PageHeader
          back={{ to: '/admin', label: 'Admin' }}
          title="Reports"
          description="Download platform data as CSV"
        />

        {/* Report cards */}
        <div className="space-y-4">
          {REPORTS.map(r => (
            <div
              key={r.key}
              className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-card p-6 flex items-start sm:items-center gap-5 flex-col sm:flex-row"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${r.color}`}>
                <r.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white">{r.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{r.desc}</p>
              </div>
              <Button
                onClick={() => download(r)}
                loading={!!busy[r.key]}
                icon={done[r.key] ? CheckCircle : Download}
                className="shrink-0"
              >
                {busy[r.key] ? 'Exporting…' : done[r.key] ? 'Downloaded' : 'Export CSV'}
              </Button>
            </div>
          ))}
        </div>

        {/* Note */}
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4 text-sm text-amber-700 dark:text-amber-400">
          Exports include all records and may contain personal data. Handle in accordance with your data protection policy.
        </div>

    </Page>
  );
};

export default AdminReports;
