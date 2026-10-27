import React from 'react';
import { Link } from 'react-router-dom';
import { Award } from 'lucide-react';
import { Card, CardHeader, ProgressBar } from '../ui';

/**
 * Badge grid. `compact` shows the earned count plus the next few to unlock (dashboard);
 * the full version lists everything (progress report).
 */
const Achievements = ({ achievements, compact = false }) => {
  const earned = achievements.filter(a => a.earned);
  const next = achievements.filter(a => !a.earned).sort((a, b) => b.progress - a.progress);
  const shown = compact ? [...earned.slice(-3).reverse(), ...next].slice(0, 4) : [...earned, ...next];

  return (
    <Card padding={false}>
      <CardHeader icon={Award} title="Achievements" subtitle={`${earned.length} of ${achievements.length} unlocked`}
        action={compact && <Link to="/progress#achievements" className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline">See all</Link>} />
      <ul className={`grid gap-3 p-4 sm:p-5 ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'}`}>
        {shown.map(a => (
          <li key={a.id} title={a.desc}
            className={`rounded-xl border p-3.5 ${a.earned
              ? 'border-amber-200 dark:border-amber-500/30 bg-gradient-to-b from-amber-50 to-white dark:from-amber-500/10 dark:to-gray-900'
              : 'border-gray-200 dark:border-gray-800'}`}>
            <span className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 ${a.earned
              ? 'bg-amber-400 text-white shadow-sm shadow-amber-500/30'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'}`}>
              <a.icon className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <p className={`text-sm font-semibold leading-tight ${a.earned ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>{a.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">{a.desc}</p>
            {a.earned ? (
              <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-2">Unlocked</p>
            ) : (
              <div className="mt-2.5">
                <ProgressBar value={Math.min(a.current, a.target)} max={a.target} size="sm" label={`${a.title} progress`} />
                <p className="text-[11px] text-gray-400 mt-1 tabular-nums">{Math.min(a.current, a.target)}/{a.target}{a.unit ? ` ${a.unit}` : ''}</p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default Achievements;
