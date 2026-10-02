import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import htm from 'htm';
import { getThemeStyles } from '../theme.js';

const html = htm.bind(h);

// Open by passing a `status` object ({ name, value, setting_key }). null/undefined means closed.
export function DeleteStatusModal({ isDarkMode, status, onClose, onDeleted }) {
  const theme = getThemeStyles(isDarkMode);

  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const isOpen = !!status;

  const cardBgColor = (theme && theme.card && theme.card.backgroundColor)
    ? theme.card.backgroundColor
    : (isDarkMode ? '#1a2332' : '#ffffff');

  const cardBorderColor = (theme && theme.card && theme.card.borderColor)
    ? theme.card.borderColor
    : (isDarkMode ? '#27354a' : '#e2e8f0');

  const subtextColor = isDarkMode ? '#8b9bb4' : '#64748b';
  const textColor = isDarkMode ? '#e2e8f0' : '#0f172a';

  // Reset state each time the modal opens for a status
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setDeleting(false);
    }
  }, [status && status.setting_key]);

  const close = () => {
    if (!deleting && onClose) onClose();
  };

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, deleting]);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/settings/status/${encodeURIComponent(status.setting_key)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete status');

      if (onDeleted) onDeleted(status);
      if (onClose) onClose();
    } catch (err) {
      console.error('Delete Error:', err);
      setError(err.message || 'Failed to delete status');
      setDeleting(false);
    }
  };

  return html`
    <div
      class="modal d-block"
      tabindex="-1"
      role="dialog"
      style="background-color: rgba(0, 0, 0, 0.6);"
      onClick=${(e) => e.target === e.currentTarget && close()}
    >
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div
          class="modal-content border rounded-3"
          style="background-color: ${cardBgColor}; border-color: ${cardBorderColor} !important; color: ${textColor};"
        >
          <div class="modal-header border-0 pb-0">
            <h6 class="fw-bold text-uppercase mb-0" style="font-size: 0.75rem; letter-spacing: 0.05em; color: ${subtextColor};">
              Delete Status
            </h6>
            <button
              type="button"
              class="btn-close ${isDarkMode ? 'btn-close-white' : ''}"
              aria-label="Close"
              disabled=${deleting}
              onClick=${close}
            ></button>
          </div>

          <div class="modal-body">
            <div class="d-flex align-items-center mb-3">
              <span
                class="badge rounded-pill fw-bold px-2.5 py-1 text-capitalize"
                style="
                  font-size: 0.75rem;
                  background-color: rgba(59, 130, 246, 0.15);
                  color: #60a5fa;
                  border: 3px solid ${status.value};
                "
              >
                ${status.name}
              </span>
            </div>

            <div style="font-size: 0.85rem; color: ${textColor};">
              Are you sure you want to delete this status?
            </div>
            <div class="mt-1" style="font-size: 0.75rem; color: ${subtextColor};">
              This can't be undone.
            </div>

            ${error && html`
              <div class="text-danger mt-3 fw-semibold" style="font-size: 0.72rem;">
                <i class="fas fa-circle-exclamation me-1"></i> ${error}
              </div>
            `}
          </div>

          <div class="modal-footer border-0 pt-0">
            <button
              type="button"
              class="btn btn-sm fw-semibold rounded-2 border"
              style="font-size: 0.75rem; color: ${subtextColor}; border-color: ${cardBorderColor} !important;"
              disabled=${deleting}
              onClick=${close}
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-sm fw-semibold rounded-2 border-0"
              style="font-size: 0.75rem; background-color: #dc2626; color: #ffffff;"
              disabled=${deleting}
              onClick=${handleDelete}
            >
              ${deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}