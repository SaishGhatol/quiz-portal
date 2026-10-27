import { useCallback, useEffect, useRef, useState } from 'react';

// Anti-cheat monitoring for a quiz in progress.
// Browser-side only — it deters casual cheating, it cannot guarantee it.

export const DEFAULT_PROCTORING = {
  enabled: false,
  requireFullscreen: true,
  blockTabSwitch: true,
  blockCopyPaste: true,
  blockContextMenu: true,
  maxViolations: 3,
};

export const VIOLATION_LABELS = {
  tab_switch:        'Switched away from the quiz tab',
  window_blur:       'Left the quiz window',
  fullscreen_exit:   'Exited fullscreen mode',
  copy:              'Tried to copy content',
  paste:             'Tried to paste content',
  cut:               'Tried to cut content',
  context_menu:      'Opened the right-click menu',
  devtools_shortcut: 'Used a developer tools shortcut',
  print_shortcut:    'Used the print shortcut',
};

// Leaving the tab fires both visibilitychange and blur, so collapse them
const AWAY_TYPES = ['tab_switch', 'window_blur'];
const AWAY_DEDUPE_MS = 1200;

const fullscreenElement = () =>
  document.fullscreenElement || document.webkitFullscreenElement || null;

const enterFullscreen = async () => {
  const el = document.documentElement;
  const request = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!request) return false;
  try {
    await request.call(el);
    return true;
  } catch {
    return false;
  }
};

const leaveFullscreen = async () => {
  if (!fullscreenElement()) return;
  const exit = document.exitFullscreen || document.webkitExitFullscreen;
  if (!exit) return;
  try {
    await exit.call(document);
  } catch {
    // Ignore — the browser may have already left fullscreen
  }
};

/**
 * @param {object}   options
 * @param {object}   options.config          quiz.proctoring settings
 * @param {boolean}  options.active          monitor only while the quiz is running
 * @param {function} options.onLimitReached  called once when maxViolations is hit
 */
export default function useProctoring({ config, active, onLimitReached }) {
  const settings = { ...DEFAULT_PROCTORING, ...(config || {}) };
  const on = settings.enabled && active;

  const [violations, setViolations]   = useState([]);
  const [lastViolation, setLast]      = useState(null);
  const [isFullscreen, setFullscreen] = useState(!!fullscreenElement());

  const violationsRef = useRef([]);
  const lastAwayAtRef = useRef(0);
  const limitFiredRef = useRef(false);
  const suppressFsRef = useRef(false);
  const onLimitRef    = useRef(onLimitReached);

  useEffect(() => { onLimitRef.current = onLimitReached; }, [onLimitReached]);

  const maxViolations = settings.maxViolations;

  const record = useCallback((type, detail) => {
    if (limitFiredRef.current) return;

    // Collapse a tab switch and the window blur that comes with it
    if (AWAY_TYPES.includes(type)) {
      const now = Date.now();
      if (now - lastAwayAtRef.current < AWAY_DEDUPE_MS) return;
      lastAwayAtRef.current = now;
    }

    const entry = { type, at: new Date().toISOString(), detail };
    violationsRef.current = [...violationsRef.current, entry];
    setViolations(violationsRef.current);
    setLast({ ...entry, index: violationsRef.current.length });

    if (maxViolations > 0 && violationsRef.current.length >= maxViolations) {
      limitFiredRef.current = true;
      onLimitRef.current?.(violationsRef.current);
    }
  }, [maxViolations]);

  // Tab switching and window focus
  useEffect(() => {
    if (!on || !settings.blockTabSwitch) return;
    const onVisibility = () => { if (document.hidden) record('tab_switch'); };
    const onBlur = () => record('window_blur');
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
    };
  }, [on, settings.blockTabSwitch, record]);

  // Copy / paste / cut
  useEffect(() => {
    if (!on || !settings.blockCopyPaste) return;
    const block = type => e => { e.preventDefault(); record(type); };
    const handlers = { copy: block('copy'), paste: block('paste'), cut: block('cut') };
    Object.entries(handlers).forEach(([evt, fn]) => document.addEventListener(evt, fn));
    return () => Object.entries(handlers).forEach(([evt, fn]) => document.removeEventListener(evt, fn));
  }, [on, settings.blockCopyPaste, record]);

  // Right-click menu
  useEffect(() => {
    if (!on || !settings.blockContextMenu) return;
    const onContextMenu = e => { e.preventDefault(); record('context_menu'); };
    document.addEventListener('contextmenu', onContextMenu);
    return () => document.removeEventListener('contextmenu', onContextMenu);
  }, [on, settings.blockContextMenu, record]);

  // Devtools and print shortcuts. Ctrl+C/V/X are left to the clipboard events above.
  useEffect(() => {
    if (!on) return;
    const onKeyDown = e => {
      const ctrl = e.ctrlKey || e.metaKey;
      const key  = e.key?.toLowerCase();
      const devtools =
        e.key === 'F12' ||
        (ctrl && e.shiftKey && ['i', 'j', 'c'].includes(key)) ||
        (ctrl && key === 'u');
      if (devtools) {
        e.preventDefault();
        record('devtools_shortcut', e.key);
        return;
      }
      if (ctrl && key === 'p') {
        e.preventDefault();
        record('print_shortcut');
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [on, record]);

  // Fullscreen lock
  useEffect(() => {
    if (!on || !settings.requireFullscreen) return;
    const onChange = () => {
      const active = !!fullscreenElement();
      setFullscreen(active);
      if (!active && !suppressFsRef.current) record('fullscreen_exit');
    };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, [on, settings.requireFullscreen, record]);

  // Warn on refresh or close so the attempt is not silently abandoned
  useEffect(() => {
    if (!on) return;
    const onBeforeUnload = e => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [on]);

  const requestFullscreen = useCallback(async () => {
    if (!settings.enabled || !settings.requireFullscreen) return true;
    const ok = await enterFullscreen();
    setFullscreen(!!fullscreenElement());
    return ok;
  }, [settings.enabled, settings.requireFullscreen]);

  // Used when the quiz ends, so our own exit is not counted as a violation
  const releaseFullscreen = useCallback(async () => {
    suppressFsRef.current = true;
    await leaveFullscreen();
    setFullscreen(false);
  }, []);

  const dismissWarning = useCallback(() => setLast(null), []);

  return {
    settings,
    violations,
    violationCount: violations.length,
    remaining: maxViolations > 0 ? Math.max(0, maxViolations - violations.length) : null,
    lastViolation,
    dismissWarning,
    isFullscreen,
    requestFullscreen,
    releaseFullscreen,
  };
}
