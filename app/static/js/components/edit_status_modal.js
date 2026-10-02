import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import htm from 'htm';
import { getThemeStyles } from '../theme.js';

const html = htm.bind(h);

// <input type="color"> only accepts #rrggbb, so normalize whatever the status stores
// (#rgb, named colors, rgb(...)) into that format. Returns null if it can't be parsed.
const normalizeColor = (v) => {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(t)) return t.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(t)) {
    return ('#' + t.slice(1).split('').map((c) => c + c).join('')).toLowerCase();
  }
  try {
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.fillStyle = '#010203';   // sentinel: unchanged means the value was invalid
    ctx.fillStyle = t;
    const out = ctx.fillStyle;
    if (out !== '#010203' && /^#[0-9a-f]{6}$/i.test(out)) return out.toLowerCase();
  } catch (e) { /* fall through */ }
  return null;
};

const DEFAULT_COLOR = '#3b82f6';

// statusId is the setting_key used in the URL. statusName and statusColor come from the list
// (display + starting color).
// Open by passing a statusId; null/undefined means closed. statusId === null/undefined means closed.
export function EditStatusModal({ isDarkMode, statusId, statusName, statusColor, onClose, onSaved }) {
  const theme = getThemeStyles(isDarkMode);

  const [status, setStatus] = useState(null);
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [initialColor, setInitialColor] = useState(DEFAULT_COLOR);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isOpen = statusId !== null && statusId !== undefined;

  const cardBgColor = (theme && theme.card && theme.card.backgroundColor)
    ? theme.card.backgroundColor
    : (isDarkMode ? '#1a2332' : '#ffffff');

  const cardBorderColor = (theme && theme.card && theme.card.borderColor)
    ? theme.card.borderColor
    : (isDarkMode ? '#27354a' : '#e2e8f0');

  const subtextColor = isDarkMode ? '#8b9bb4' : '#64748b';
  const textColor = isDarkMode ? '#e2e8f0' : '#0f172a';

  // Fetch the selected status whenever a new id is passed in
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setStatus(null);
    setError(null);
    setLoading(true);

    // Start from the color the list already knows about, so the picker is right immediately
    const startColor = normalizeColor(statusColor) || DEFAULT_COLOR;
    setColor(startColor);
    setInitialColor(startColor);

    // GET /api/settings/status/<setting_key> -> { key, value }
    fetch(`/api/settings/status/${encodeURIComponent(statusId)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch status');
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setStatus(data);
        // The server value is the source of truth; fall back to the list's color
        const fetched = normalizeColor(data.value) || startColor;
        setColor(fetched);
        setInitialColor(fetched);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('API Error:', err);
        setError(err.message || 'Something went wrong');
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [statusId]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === 'Escape' && onClose && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // PUT /api/settings/status/<setting_key> with { value } (backend route must allow PUT)
      const res = await fetch(`/api/settings/status/${encodeURIComponent(statusId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: color }),
      });
      if (!res.ok) throw new Error('Failed to save color');

      if (onSaved) onSaved({ ...status, value: color });
      if (onClose) onClose();
    } catch (err) {
      console.error('Save Error:', err);
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const unchanged = !status || color === initialColor;

  return html`
    <div
      class="modal d-block"
      tabindex="-1"
      role="dialog"
      style="background-color: rgba(0, 0, 0, 0.6);"
      onClick=${(e) => e.target === e.currentTarget && onClose && onClose()}
    >
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div
          class="modal-content border rounded-3"
          style="background-color: ${cardBgColor}; border-color: ${cardBorderColor} !important; color: ${textColor};"
        >
          <div class="modal-header border-0 pb-0">
            <h6 class="fw-bold text-uppercase mb-0" style="font-size: 0.75rem; letter-spacing: 0.05em; color: ${subtextColor};">
              Edit Status
            </h6>
            <button
              type="button"
              class="btn-close ${isDarkMode ? 'btn-close-white' : ''}"
              aria-label="Close"
              onClick=${onClose}
            ></button>
          </div>

          <div class="modal-body">
            ${loading && html`
              <div class="fw-semibold" style="font-size: 0.72rem; color: ${subtextColor};">
                <i class="fas fa-spinner fa-spin me-1"></i> Fetching status
              </div>
            `}

            ${error && html`
              <div class="text-danger mb-2 fw-semibold" style="font-size: 0.72rem;">
                <i class="fas fa-circle-exclamation me-1"></i> ${error}
              </div>
            `}

            ${status && html`
              <div class="d-flex align-items-center justify-content-between">
                <span
                  class="badge rounded-pill fw-bold px-2.5 py-1 text-capitalize me-2"
                  style="
                    font-size: 0.75rem;
                    background-color: rgba(59, 130, 246, 0.15);
                    color: #60a5fa;
                    border: 1px solid ${color};
                  "
                >
                  ${statusName || status.name || status.key}
                </span>

                <div class="d-flex align-items-center gap-2">
                  <span style="font-size: 0.7rem; font-family: monospace; color: ${subtextColor};">${color}</span>
                  <input
                    type="color"
                    class="form-control form-control-color p-1"
                    style="width: 2.5rem; height: 2rem; background: transparent; border-color: ${cardBorderColor};"
                    title="Choose a new color"
                    value=${color}
                    onInput=${(e) => setColor(e.target.value)}
                  />
                </div>
              </div>
            `}
          </div>

          <div class="modal-footer border-0 pt-0">
            <button
              type="button"
              class="btn btn-sm fw-semibold rounded-2 border"
              style="font-size: 0.75rem; color: ${subtextColor}; border-color: ${cardBorderColor} !important;"
              onClick=${onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-sm fw-semibold rounded-2 border-0"
              style="font-size: 0.75rem; background-color: #2563eb; color: #ffffff;"
              disabled=${saving || loading || unchanged}
              onClick=${handleSave}
            >
              ${saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}