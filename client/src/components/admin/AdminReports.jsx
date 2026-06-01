import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { ArrowLeft, Download, Users, FileText, Loader, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const REPORTS = [
  {
    key: 'users',
    title: 'User export',
    desc: 'All registered users — name, email, role, status, join date.',
    icon: Users,
    filename: 'users',
    color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/admin" className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="h-4 w-4 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Download platform data as CSV</p>
          </div>
        </div>

        {/* Report cards */}
        <div className="space-y-4">
          {REPORTS.map(r => (
            <div
              key={r.key}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 flex items-start sm:items-center gap-5 flex-col sm:flex-row"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${r.color}`}>
                <r.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white">{r.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{r.desc}</p>
              </div>
              <button
                onClick={() => download(r)}
                disabled={busy[r.key]}
                className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {busy[r.key] ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : done[r.key] ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {busy[r.key] ? 'Exporting…' : done[r.key] ? 'Downloaded' : 'Export CSV'}
              </button>
            </div>
          ))}
        </div>

        {/* Note */}
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4 text-sm text-amber-700 dark:text-amber-400">
          Exports include all records and may contain personal data. Handle in accordance with your data protection policy.
        </div>

      </div>
    </div>
  );
};

export default AdminReports;
