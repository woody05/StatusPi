import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import htm from 'htm';
import { getThemeStyles } from '../theme.js';

const html = htm.bind(h);

const DISPLAY_MODES = [
  { id: 'solid', label: 'Solid', icon: 'fa-lightbulb', description: 'Steady light output' },
  { id: 'flashing', label: 'Flashing', icon: 'fa-bolt', description: 'Rhythmic pulsing' },
  { id: 'wave', label: 'Wave', icon: 'fa-water', description: 'Cascading brightness' },
  { id: 'scatter', label: 'Scatter', icon: 'fa-dharmachakra', description: 'Randomized pattern' },
];

export function DefaultModeSetting({ isDarkMode }) {
  const theme = getThemeStyles(isDarkMode);

  const [selectedMode, setSelectedMode] = useState('solid');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const cardBgColor =
    theme?.card?.backgroundColor ||
    (isDarkMode ? '#1a2332' : '#ffffff');

  const cardBorderColor =
    theme?.card?.borderColor ||
    (isDarkMode ? '#27354a' : '#e2e8f0');

  const subtextColor = isDarkMode ? '#8b9bb4' : '#64748b';

  // Fetch initial default mode
  useEffect(() => {
    const loadDefaultMode = async () => {
      try {
        const response = await fetch('/api/settings/default/mode');

        if (!response.ok) {
          throw new Error('Failed to fetch default mode');
        }

        const data = await response.json();

        // API may return either:
        // "flashing"
        // or { value: "flashing" }
        const mode =
          typeof data === 'string'
            ? data
            : data?.value;

        if (mode) {
          setSelectedMode(mode.toLowerCase());
        }
      } catch (err) {
        console.error('API Error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDefaultMode();
  }, []);

  const handleModeChange = async (newMode) => {
    // Update UI immediately
    setSelectedMode(newMode);
    setSaving(true);

    try {
      const response = await fetch('/api/settings/default/mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: newMode,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update default mode');
      }

      const data = await response.json();

      // API may return either:
      // "flashing"
      // or { value: "flashing" }
      const savedMode =
        typeof data === 'string'
          ? data
          : data?.value;

      if (savedMode) {
        setSelectedMode(savedMode.toLowerCase());
      }
    } catch (err) {
      console.error('Failed to update default mode:', err);

      // If save failed, optionally revert by reloading
      // the value from the API.
      try {
        const response = await fetch('/api/settings/default/mode');

        if (response.ok) {
          const data = await response.json();

          const mode =
            typeof data === 'string'
              ? data
              : data?.value;

          if (mode) {
            setSelectedMode(mode.toLowerCase());
          }
        }
      } catch (reloadError) {
        console.error('Failed to reload default mode:', reloadError);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return html`
      <div
        class="card border rounded-3 h-100"
        style="
          background-color: ${cardBgColor};
          border-color: ${cardBorderColor} !important;
        "
      >
        <div
          class="card-body p-4 text-center d-flex flex-column justify-content-center align-items-center"
          style="min-height: 180px;"
        >
          <div
            class="spinner-border spinner-border-sm text-primary mb-2"
            role="status"
          ></div>

          <div
            style="
              font-size: 0.85rem;
              font-weight: 600;
              color: ${subtextColor};
            "
          >
            Loading Mode Settings...
          </div>
        </div>
      </div>
    `;
  }

  return html`
    <div
      class="card border rounded-3 h-100"
      style="
        background-color: ${cardBgColor};
        border-color: ${cardBorderColor} !important;
      "
    >
      <style>
        .mode-preset-btn:active {
          transform: scale(0.97);
        }
      </style>

      <div class="card-body p-3 p-md-4 d-flex flex-column justify-content-between">

        <div>
          <div class="d-flex align-items-center justify-content-between mb-3">

            <h6
              class="fw-bold text-uppercase mb-0"
              style="
                font-size: 0.75rem;
                letter-spacing: 0.05em;
                color: ${subtextColor};
              "
            >
              Default Display Mode
            </h6>

            <span
              class="badge rounded-pill fw-bold px-2.5 py-1 text-capitalize"
              style="
                font-size: 0.75rem;
                background-color: rgba(59, 130, 246, 0.15);
                color: #60a5fa;
                border: 1px solid rgba(59, 130, 246, 0.3);
              "
            >
              ${selectedMode}
            </span>

          </div>

          <div
            class="mb-3"
            style="
              font-size: 0.75rem;
              font-weight: 500;
              color: ${subtextColor};
            "
          >
            Select the pattern applied automatically when StatusPi powers on.
          </div>
        </div>

        <div class="row g-2 pt-1">

          ${DISPLAY_MODES.map((mode) => {
            const isSelected = selectedMode === mode.id;

            return html`
              <div class="col-6" key=${mode.id}>

                <button
                  type="button"
                  class="btn mode-preset-btn w-100 py-2.5 px-3 rounded-2 border-0 d-flex flex-column align-items-start text-start"
                  disabled=${saving}
                  style="
                    background-color: ${
                      isSelected
                        ? '#2563eb'
                        : (isDarkMode ? '#111827' : '#f1f5f9')
                    };

                    color: ${
                      isSelected
                        ? '#ffffff'
                        : (isDarkMode ? '#cbd5e1' : '#475569')
                    };

                    transition: all 0.12s ease;
                    opacity: ${saving && !isSelected ? '0.7' : '1'};
                  "
                  onClick=${() => handleModeChange(mode.id)}
                >

                  <div class="d-flex align-items-center gap-2 mb-1">

                    <i
                      class=${`fas ${mode.icon}`}
                      style="
                        font-size: 0.8rem;
                        color: ${isSelected ? '#ffffff' : '#3b82f6'};
                      "
                    ></i>

                    <span
                      class="fw-semibold"
                      style="font-size: 0.8rem;"
                    >
                      ${mode.label}
                    </span>

                  </div>

                  <span
                    class="text-truncate w-100"
                    style="
                      font-size: 0.68rem;
                      color: ${
                        isSelected
                          ? 'rgba(255, 255, 255, 0.8)'
                          : subtextColor
                      };
                    "
                  >
                    ${mode.description}
                  </span>

                </button>

              </div>
            `;
          })}

        </div>

      </div>
    </div>
  `;
}
