// Shared helpers for the quiz proctoring / anti-cheat feature.

const VIOLATION_TYPES = [
  'tab_switch', 'window_blur', 'fullscreen_exit', 'copy', 'paste',
  'cut', 'context_menu', 'devtools_shortcut', 'print_shortcut'
];

const MAX_STORED_VIOLATIONS = 200;

const PROCTORING_DEFAULTS = {
  enabled:           false,
  requireFullscreen: true,
  blockTabSwitch:    true,
  blockCopyPaste:    true,
  blockContextMenu:  true,
  maxViolations:     3
};
const BOOLEAN_KEYS = ['enabled', 'requireFullscreen', 'blockTabSwitch', 'blockCopyPaste', 'blockContextMenu'];
const MAX_VIOLATIONS_LIMIT = 20;

// Only real booleans (or their exact string forms from form posts) count; anything else is ignored
const toBool = v => {
  if (v === true || v === 'true') return true;
  if (v === false || v === 'false') return false;
  return undefined;
};

/**
 * Coerce proctoring settings from an admin form into the schema shape.
 * Keys that are missing or not a strict boolean keep their existing value (or the default),
 * so a partial update like { enabled: true } doesn't reset the other rules.
 * maxViolations is clamped to 0–20.
 * Pass the quiz's current settings as `existing` when updating.
 */
const normalizeProctoring = (p, existing) => {
  if (!p || typeof p !== 'object' || Array.isArray(p)) return undefined;
  const base = { ...PROCTORING_DEFAULTS };
  if (existing && typeof existing === 'object') {
    const src = typeof existing.toObject === 'function' ? existing.toObject() : existing;
    for (const k of Object.keys(PROCTORING_DEFAULTS)) {
      if (src[k] !== undefined && src[k] !== null) base[k] = src[k];
    }
  }

  const out = { ...base };
  for (const k of BOOLEAN_KEYS) {
    const b = toBool(p[k]);
    if (b !== undefined) out[k] = b;
  }
  if (p.maxViolations !== undefined && p.maxViolations !== null && p.maxViolations !== '') {
    const limit = Number(p.maxViolations);
    if (Number.isFinite(limit)) {
      out.maxViolations = Math.min(MAX_VIOLATIONS_LIMIT, Math.max(0, Math.floor(limit)));
    }
  }
  return out;
};

// Violations come from the browser, so drop anything unrecognised and cap the list
const sanitizeViolations = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(v => v && VIOLATION_TYPES.includes(v.type))
    .slice(0, MAX_STORED_VIOLATIONS)
    .map(v => {
      const at = v.at ? new Date(v.at) : new Date();
      return {
        type: v.type,
        at: isNaN(at.getTime()) ? new Date() : at,
        detail: typeof v.detail === 'string' ? v.detail.slice(0, 200) : undefined
      };
    });
};

module.exports = { VIOLATION_TYPES, PROCTORING_DEFAULTS, normalizeProctoring, sanitizeViolations };
