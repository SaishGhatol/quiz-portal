import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { DEFAULT_PROCTORING } from '../../utils/useProctoring';

const RULES = [
  { key: 'requireFullscreen', label: 'Require fullscreen',      hint: 'Hide the questions whenever the candidate leaves fullscreen.' },
  { key: 'blockTabSwitch',    label: 'Detect tab switching',    hint: 'Record every switch to another tab, window or app.' },
  { key: 'blockCopyPaste',    label: 'Block copy & paste',      hint: 'Disable copy, cut, paste and text selection.' },
  { key: 'blockContextMenu',  label: 'Block right-click menu',  hint: 'Disable the context menu and developer tools shortcuts.' },
];

const Toggle = ({ checked, onChange, disabled }) => (
  <label className={`relative inline-flex items-center ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
    <input type="checkbox" checked={checked} disabled={disabled} onChange={e => onChange(e.target.checked)} className="sr-only peer" />
    <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-brand-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
  </label>
);

// Shared proctoring panel for the create and edit quiz forms
const ProctoringSettings = ({ value, onChange }) => {
  const settings = { ...DEFAULT_PROCTORING, ...(value || {}) };
  const set = (key, v) => onChange({ ...settings, [key]: v });

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-card overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-gray-400" />
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">Proctoring &amp; Security</h2>
            <p className="text-xs text-gray-400 mt-0.5">Monitor candidates while they take this quiz.</p>
          </div>
        </div>
        <Toggle checked={settings.enabled} onChange={v => set('enabled', v)} />
      </div>

      {settings.enabled && (
        <div className="p-6 space-y-1">
          {RULES.map(rule => (
            <div key={rule.key} className="flex items-center justify-between gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{rule.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{rule.hint}</p>
              </div>
              <Toggle checked={settings[rule.key] !== false} onChange={v => set(rule.key, v)} />
            </div>
          ))}

          <div className="flex items-center justify-between gap-4 p-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto-submit after</p>
              <p className="text-xs text-gray-400 mt-0.5">Set to 0 to only record violations and never auto-submit.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input type="number" min="0" max="20" value={settings.maxViolations}
                onChange={e => set('maxViolations', e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)}
                className="w-20 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
              <span className="text-xs text-gray-400">violations</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProctoringSettings;
