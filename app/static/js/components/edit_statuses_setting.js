import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import htm from 'htm';
import { getThemeStyles } from '../theme.js';
import { EditStatusModal } from './edit_status_modal.js';
import { DeleteStatusModal } from './delete_status_modal.js';

const html = htm.bind(h);

export function EditStatusesSetting({ isDarkMode, onStatusAdded }) {
  const theme = getThemeStyles(isDarkMode);

  const [statuses, setStatuses] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // the status object being edited
  const [deleting, setDeleting] = useState(null); // the status object pending deletion

  // Theme variable fallbacks matching your existing components
  const cardBgColor = (theme && theme.card && theme.card.backgroundColor)
    ? theme.card.backgroundColor
    : (isDarkMode ? '#1a2332' : '#ffffff');

  const cardBorderColor = (theme && theme.card && theme.card.borderColor)
    ? theme.card.borderColor
    : (isDarkMode ? '#27354a' : '#e2e8f0');

  const subtextColor = isDarkMode ? '#8b9bb4' : '#64748b';

  const fetchStatuses = () => {
    setLoading(true);
    fetch('/api/settings/status')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch statuses data');
        return res.json();
      })
      .then((data) => {
        setStatuses(data);
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        console.error('API Error:', err);
        setError(err.message || 'Something went wrong');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const handleEdit = (e, status) => {
    e.preventDefault();
    e.stopPropagation();
    setEditing(status); // opens the modal for this status
  };

  const handleDelete = (e, status) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleting(status); // opens the delete confirmation modal
  };

  const handleDeleted = () => {
    fetchStatuses(); // refresh the list without the deleted status
    if (onStatusAdded) onStatusAdded();
  };

  const handleSaved = () => {
    fetchStatuses(); // refresh the list with the new color
    if (onStatusAdded) onStatusAdded();
  };

  return html`
    <div class="card border rounded-3 h-100" style="background-color: ${cardBgColor}; border-color: ${cardBorderColor} !important;">
      <div class="card-body p-3 p-md-4 d-flex flex-column justify-content-between">

        <!-- Header -->
        <div>
          <div class="d-flex align-items-center justify-content-between mb-3">
            <h6 class="fw-bold text-uppercase mb-0" style="font-size: 0.75rem; letter-spacing: 0.05em; color: ${subtextColor};">
              Statuses
            </h6>
          </div>

          ${loading && html`
            <div class="mb-2 fw-semibold" style="font-size: 0.72rem; color: ${subtextColor};">
              <i class="fas fa-spinner fa-spin me-1"></i> Fetching statuses
            </div>
          `}

          ${error && html`
            <div class="text-danger mb-2 fw-semibold" style="font-size: 0.72rem;">
              <i class="fas fa-circle-exclamation me-1"></i> ${error}
            </div>
          `}

          ${statuses.map((status) => html`
            <div class="row g-2 pt-1" key=${status.id}>
              <div class="col-12">
                <div class="d-flex align-items-center justify-content-between mb-3">

                  <span
                    class="badge rounded-pill fw-bold px-2.5 py-1 text-capitalize me-2"
                    style="
                      font-size: 0.75rem;
                      background-color: rgba(59, 130, 246, 0.15);
                      color: #60a5fa;
                      border: 3px solid ${status.value};
                    "
                  >
                    ${status.name}
                  </span>

                  <div class="d-flex align-items-center justify-content-between">
                    <button
                      type="button"
                      onClick=${(e) => handleEdit(e, status)}
                      class="btn py-2 px-2 fw-semibold rounded-2 border-0 d-flex align-items-center justify-content-center gap-2 mx-2"
                      style="font-size: 0.75rem; background-color: #2563eb; color: #ffffff; transition: all 0.12s ease;"
                    >
                      <i class="fas fa-pen" style="font-size: 0.75rem;"></i>
                    </button>

                    <button
                      type="button"
                      onClick=${(e) => handleDelete(e, status)}
                      class="btn py-2 px-2 fw-semibold rounded-2 border-0 d-flex align-items-center justify-content-center gap-2 mx-2"
                      style="font-size: 0.75rem; background-color: red; color: #ffffff; transition: all 0.12s ease;"
                    >
                      <i class="fas fa-trash-can" style="font-size: 0.75rem;"></i>
                    </button>
                  </div>

                </div>
              </div>
            </div>
          `)}
        </div>
      </div>

      <${EditStatusModal}
        isDarkMode=${isDarkMode}
        statusId=${editing ? editing.setting_key : null}
        statusName=${editing ? editing.name : null}
        statusColor=${editing ? editing.value : null}
        onClose=${() => setEditing(null)}
        onSaved=${handleSaved}
      />

      <${DeleteStatusModal}
        isDarkMode=${isDarkMode}
        status=${deleting}
        onClose=${() => setDeleting(null)}
        onDeleted=${handleDeleted}
      />
    </div>
  `;
}