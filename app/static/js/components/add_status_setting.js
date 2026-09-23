import { h } from 'preact';
import { useState } from 'preact/hooks';
import htm from 'htm';
import { getThemeStyles } from '../theme.js';

const html = htm.bind(h);

export function AddStatusSetting({ isDarkMode, onStatusAdded }) {
  const theme = getThemeStyles(isDarkMode);

  const [name, setName] = useState('');
  const [color, setColor] = useState('#10b981');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Theme variable fallbacks matching your existing components
  const cardBgColor = (theme && theme.card && theme.card.backgroundColor) 
    ? theme.card.backgroundColor 
    : (isDarkMode ? '#1a2332' : '#ffffff');
    
  const cardBorderColor = (theme && theme.card && theme.card.borderColor) 
    ? theme.card.borderColor 
    : (isDarkMode ? '#27354a' : '#e2e8f0');

  const subtextColor = isDarkMode ? '#8b9bb4' : '#64748b';
  const textColor = isDarkMode ? '#f8fafc' : '#0f172a';
  const inputBg = isDarkMode ? '#111827' : '#f1f5f9';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    // Payload formatted to match Python Status.to_dict() schema
    const payload = {
      name: name.trim(),
      color: color
    };

    try {
      const res = await fetch('/api/statuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to create status');
      const createdStatus = await res.json();

      setName('');
      setSuccess(true);
      if (onStatusAdded) onStatusAdded(createdStatus);

      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      console.error('Error adding status:', err);
      setError('Failed to save status. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return html`
    <div class="card border rounded-3 h-100" style="background-color: ${cardBgColor}; border-color: ${cardBorderColor} !important;">
      <div class="card-body p-3 p-md-4 d-flex flex-column justify-content-between">
        
        <!-- Header -->
        <div>
          <div class="d-flex align-items-center justify-content-between mb-3">
            <h6 class="fw-bold text-uppercase mb-0" style="font-size: 0.75rem; letter-spacing: 0.05em; color: ${subtextColor};">
              Add New Status
            </h6>

            <!-- Live Preview Badge -->
            <span 
              class="badge rounded-pill fw-bold px-2.5 py-1 d-flex align-items-center gap-1.5" 
              style="
                font-size: 0.75rem; 
                background-color: ${color}22; 
                color: ${color}; 
                border: 1px solid ${color}55;
              "
            >
              <span style="width: 6px; height: 6px; border-radius: 50%; background-color: ${color}; box-shadow: 0 0 6px ${color};"></span>
              ${name.trim() || 'Preview'}
            </span>
          </div>

          <form onSubmit=${handleSubmit}>
            <!-- Status Name Input -->
            <div class="mb-3">
              <label class="text-uppercase mb-1 fw-semibold d-block" style="font-size: 0.65rem; letter-spacing: 0.05em; color: ${subtextColor};">
                Status Name
              </label>
              <input 
                type="text" 
                class="form-control border-0 rounded-2 px-3 py-2 fw-semibold"
                placeholder="e.g. In a Meeting, On Break"
                value=${name}
                onInput=${(e) => setName(e.target.value)}
                required
                style="
                  background-color: ${inputBg}; 
                  color: ${textColor}; 
                  font-size: 0.8rem;
                "
              />
            </div>

            <!-- Direct Color Selection Input -->
            <div class="mb-3">
              <label class="text-uppercase mb-1 fw-semibold d-block" style="font-size: 0.65rem; letter-spacing: 0.05em; color: ${subtextColor};">
                Status Color
              </label>

              <div class="d-flex align-items-center gap-2">
                <!-- Color Picker Button -->
                <div 
                  class="rounded-2 p-1 d-flex align-items-center justify-content-center"
                  style="
                    width: 38px; 
                    height: 38px; 
                    background-color: ${inputBg}; 
                    border: 1px solid ${cardBorderColor};
                  "
                >
                  <input 
                    type="color" 
                    value=${color} 
                    onInput=${(e) => setColor(e.target.value)}
                    style="
                      width: 100%; 
                      height: 100%; 
                      border: none; 
                      border-radius: 4px; 
                      cursor: pointer; 
                      background: transparent;
                    "
                  />
                </div>

                <!-- Hex Value Text Input -->
                <input 
                  type="text" 
                  class="form-control border-0 rounded-2 px-3 py-2 fw-semibold font-monospace"
                  value=${color}
                  onInput=${(e) => setColor(e.target.value)}
                  placeholder="#000000"
                  maxlength="7"
                  style="
                    background-color: ${inputBg}; 
                    color: ${textColor}; 
                    font-size: 0.8rem;
                  "
                />
              </div>
            </div>

            <!-- Action Alerts -->
            ${error && html`
              <div class="text-danger mb-2 fw-semibold" style="font-size: 0.72rem;">
                <i class="fas fa-circle-exclamation me-1"></i> ${error}
              </div>
            `}

            ${success && html`
              <div class="text-success mb-2 fw-semibold" style="font-size: 0.72rem;">
                <i class="fas fa-circle-check me-1"></i> Status created successfully!
              </div>
            `}

            <!-- Submit Button -->
            <button 
              type="submit" 
              class="btn w-100 py-2 px-0 fw-semibold rounded-2 border-0 d-flex align-items-center justify-content-center gap-2"
              disabled=${submitting || !name.trim()}
              style="
                font-size: 0.75rem;
                background-color: #2563eb;
                color: #ffffff;
                opacity: ${(!name.trim() || submitting) ? 0.6 : 1};
                transition: all 0.12s ease;
              "
            >
              ${submitting ? html`
                <div class="spinner-border spinner-border-sm" role="status" style="width: 0.85rem; height: 0.85rem;"></div>
                <span>Saving...</span>
              ` : html`
                <i class="fas fa-plus" style="font-size: 0.75rem;"></i>
                <span>Add Status</span>
              `}
            </button>
          </form>
        </div>

      </div>
    </div>
  `;
}