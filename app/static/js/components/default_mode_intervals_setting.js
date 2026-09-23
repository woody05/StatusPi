import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import htm from 'htm';
import { getThemeStyles } from '../theme.js';

const html = htm.bind(h);

export function ModeIntervalsSetting({ isDarkMode }) {
  const theme = getThemeStyles(isDarkMode);

  // Set the default initial state within the 0.1 - 1 range (e.g., 0.5)
  const [waveIntervals, setWaveIntervals] = useState(0.5);
  const [loading, setLoading] = useState(true);

  const cardBgColor =
    theme?.card?.backgroundColor ||
    (isDarkMode ? '#1a2332' : '#ffffff');

  const cardBorderColor =
    theme?.card?.borderColor ||
    (isDarkMode ? '#27354a' : '#e2e8f0');

  // Fetch initial default mode
  useEffect(() => {
    const loadWaveIntervals = async () => {
      try {
        const response = await fetch('api/settings/mode/intervals/wave');

        if (!response.ok) {
          throw new Error('Failed to fetch wave intervals');
        }

        const data = await response.json();

        if (data) {
          // Parse as float to preserve decimals
          const val = typeof data === 'object' ? parseFloat(data.value) : parseFloat(data);
          if (!isNaN(val)) {
            setWaveIntervals(val);
          }
        }
      } catch (err) {
        console.error('API Error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadWaveIntervals();
  }, []);

  const handleWaveIntervalChange = async (e) => {
    // Crucial: use parseFloat instead of parseInt for decimal ranges
    const newValue = parseFloat(e.target.value);
    setWaveIntervals(newValue);

    console.log("Selected interval speed:", newValue);
    
    // TODO: Add your fetch('/api/settings/mode/intervals/wave', { method: 'POST', ... }) here to save
  };

  const subtextColor = isDarkMode ? '#8b9bb4' : '#64748b';

  const activeTrack = '#3b82f6';
  const inactiveTrack = isDarkMode ? '#0f172a' : '#e2e8f0';

  // Math to map the 0.1 to 1 range smoothly into a 0% to 100% track background fill
  const percentage = ((waveIntervals - 0.1) / 1.9) * 100;

  const trackGradient = `
    linear-gradient(
      to right,
      ${activeTrack} 0%,
      ${activeTrack} ${percentage}%,
      ${inactiveTrack} ${percentage}%,
      ${inactiveTrack} 100%
    )
  `;

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
              Default Intervals
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
              ${waveIntervals.toFixed(1)}s
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
            Adjust the interval settings to desired speeds.
          </div>
        </div>

        <div class="row g-2 pt-1">
          <div class="col-12">
            <!-- Custom Glow Slider -->
            <div class="my-4 position-relative">

              <input
                type="range"
                class="glow-range-input"
                min="0.1"
                max="2"
                step="0.1"
                value=${waveIntervals}
                onInput=${handleWaveIntervalChange}
                aria-label="Wave speed interval setting"
                style="background: ${trackGradient}; width: 100%;"
              />

              <div
                class="d-flex justify-content-between mt-2"
                style="
                  font-size: 0.75rem;
                  font-weight: 600;
                  color: ${subtextColor};
                "
              >
                <span>0.1s</span>
                <span>1.0s</span>
                <span>2.0s</span>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  `;
}
