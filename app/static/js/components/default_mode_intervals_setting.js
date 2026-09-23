import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import htm from 'htm';
import { getThemeStyles } from '../theme.js';

const html = htm.bind(h);

const SAVE_DEBOUNCE_MS = 200;

// Config for each interval slider. Add/remove entries here to add more
// interval types without touching the render logic below.
const INTERVAL_TYPES = [
  { key: 'wave', label: 'Wave Intervals', endpoint: '/api/settings/mode/intervals/wave' },
  { key: 'flashing', label: 'Flashing Intervals', endpoint: '/api/settings/mode/intervals/flashing' },
  { key: 'scatter', label: 'Scatter Intervals', endpoint: '/api/settings/mode/intervals/scatter' },
];

export function ModeIntervalsSetting({ isDarkMode }) {
  const theme = getThemeStyles(isDarkMode);

  // One state value per interval type, all defaulting to 0.5s.
  const [intervals, setIntervals] = useState(
    Object.fromEntries(INTERVAL_TYPES.map((t) => [t.key, 0.5]))
  );
  const [loading, setLoading] = useState(true);

  // One debounce timer per interval type so adjusting one slider doesn't
  // cancel/delay the save of another.
  const timeoutRefs = useRef({});

  const cardBgColor =
    theme?.card?.backgroundColor ||
    (isDarkMode ? '#1a2332' : '#ffffff');

  const cardBorderColor =
    theme?.card?.borderColor ||
    (isDarkMode ? '#27354a' : '#e2e8f0');

  const subtextColor = isDarkMode ? '#8b9bb4' : '#64748b';

  const activeTrack = '#3b82f6';
  const inactiveTrack = isDarkMode ? '#0f172a' : '#e2e8f0';

  // Fetch initial values for every interval type in parallel.
  useEffect(() => {
    const loadAllIntervals = async () => {
      const results = await Promise.all(
        INTERVAL_TYPES.map(async ({ key, endpoint }) => {
          try {
            const response = await fetch(endpoint);
            if (!response.ok) {
              throw new Error(`Failed to fetch ${key} interval`);
            }
            const data = await response.json();
            const val = typeof data === 'object' && data !== null
              ? parseFloat(data.value)
              : parseFloat(data);
            return [key, isNaN(val) ? null : val];
          } catch (err) {
            console.error(`API Error loading ${key} interval:`, err);
            return [key, null];
          }
        })
      );

      setIntervals((prev) => {
        const next = { ...prev };
        for (const [key, val] of results) {
          if (val !== null) next[key] = val;
        }
        return next;
      });
      setLoading(false);
    };

    loadAllIntervals();
  }, []);

  const saveInterval = (key, endpoint, newValue) => {
    if (timeoutRefs.current[key]) {
      clearTimeout(timeoutRefs.current[key]);
    }

    timeoutRefs.current[key] = setTimeout(async () => {
      try {
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: newValue }),
        });
      } catch (err) {
        console.error(`Failed to save ${key} interval:`, err);
      }
    }, SAVE_DEBOUNCE_MS);
  };

  const handleIntervalChange = (key, endpoint) => (e) => {
    // Crucial: use parseFloat instead of parseInt for decimal ranges
    const newValue = parseFloat(e.target.value);
    setIntervals((prev) => ({ ...prev, [key]: newValue }));
    saveInterval(key, endpoint, newValue);
  };

  // Math to map the 0.1 to 2 range smoothly into a 0% to 100% track background fill
  const getTrackGradient = (value) => {
    const percentage = ((value - 0.1) / 1.9) * 100;
    return `
      linear-gradient(
        to right,
        ${activeTrack} 0%,
        ${activeTrack} ${percentage}%,
        ${inactiveTrack} ${percentage}%,
        ${inactiveTrack} 100%
      )
    `;
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

        ${INTERVAL_TYPES.map(({ key, label, endpoint }) => html`
          <div class="row g-2 pt-1" key=${key}>
            <div class="col-12">
              <div class="d-flex align-items-center justify-content-between mb-3">
                <h6
                  class="fw-bold text-uppercase mb-0"
                  style="
                    font-size: 0.65rem;
                    letter-spacing: 0.05em;
                    color: ${subtextColor};
                  "
                >
                  ${label}
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
                  ${intervals[key].toFixed(1)}s
                </span>
              </div>

              <!-- Custom Glow Slider -->
              <div class="my-4 position-relative">

                <input
                  type="range"
                  class="glow-range-input"
                  min="0.1"
                  max="2"
                  step="0.1"
                  value=${intervals[key]}
                  onInput=${handleIntervalChange(key, endpoint)}
                  aria-label=${`${label} speed interval setting`}
                  style="background: ${getTrackGradient(intervals[key])}; width: 100%;"
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
        `)}

      </div>
    </div>
  `;
}