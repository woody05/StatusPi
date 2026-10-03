import { h } from "preact";
import { useState, useEffect, useRef } from "preact/hooks";
import htm from "htm";
import { getThemeStyles } from "../theme.js";

const html = htm.bind(h);

const SAVE_DEBOUNCE_MS = 200;

export function ModeIntervalsControls({ isDarkMode, mode }) {
  const [modeInterval, setModeInterval] = useState(0.01);
  const [activeMode, setActiveMode] = useState(mode || "");
  const [modeLoaded, setModeLoaded] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  const timeoutRefs = useRef({});

  // Sync activeMode state when the mode prop changes from the parent
  useEffect(() => {
    if (mode) {
      setActiveMode(mode);
    }
  }, [mode]);

  const subtextColor = isDarkMode ? "#8b9bb4" : "#64748b";

  const activeTrack = '#3b82f6';
  const inactiveTrack = isDarkMode ? '#0f172a' : '#e2e8f0';

  const theme = getThemeStyles(isDarkMode);
  const loading = !modeLoaded;

  const getModeIcon = (modeStr) => {
    const mode = String(modeStr).toUpperCase();
    switch (mode) {
      case "OFF":
        return "fa-power-off";
      case "SOLID":
        return "fa-lightbulb";
      case "WAVE":
        return "fa-wave-square";
      case "FLASHING":
        return "fa-bolt";
      case "SCATTER":
        return "fa-bahai";
      default:
        return "fa-sliders-h";
    }
  };

  const formatModeName = (modeStr) => {
    return String(modeStr)
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Fetch intervals whenever activeMode changes
  useEffect(() => {
    if (!activeMode) return;

    setModeLoaded(false);
    fetch("/api/mode/interval")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch mode Intervals");
        return res.json();
      })
      .then((data) => {
        const modeIntervals = data;
        const activeModeIntervals = modeIntervals[activeMode];
        if (activeModeIntervals !== undefined) {
          setModeInterval(activeModeIntervals);
        }
        setModeLoaded(true);
      })
      .catch((err) => {
        console.error("API Error:", err);
        setModeLoaded(true);
      });
  }, [activeMode]);

  const saveInterval = (newValue) => {
    if (timeoutRefs.current[activeMode]) {
      clearTimeout(timeoutRefs.current[activeMode]);
    }

    timeoutRefs.current[activeMode] = setTimeout(async () => {
      try {
        await fetch('/api/mode/interval', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: activeMode, value: newValue }),
        });
      } catch (err) {
        console.error(`Failed to save ${activeMode} interval:`, err);
      }
    }, SAVE_DEBOUNCE_MS);
  };

  const handleIntervalChange = () => (e) => {
    const newValue = parseFloat(e.target.value);
    setModeInterval(newValue);
    saveInterval(newValue);
  };

  const getTrackGradient = (value) => {
    const rawPercentage = ((value - 0.01) / 1.99) * 100;
    const percentage = Math.max(0, Math.min(100, rawPercentage));

    return `
        linear-gradient(
          to right,
          ${activeTrack} 0\%,${activeTrack} ${percentage}\%,${inactiveTrack} ${percentage}\%,${inactiveTrack} 100%
        )
      `;
  };

  const cardBgColor =
    theme && theme.card && theme.card.backgroundColor
      ? theme.card.backgroundColor
      : isDarkMode
        ? "#1a2332"
        : "#ffffff";

  const cardBorderColor =
    theme && theme.card && theme.card.borderColor
      ? theme.card.borderColor
      : isDarkMode
        ? "#27354a"
        : "#e2e8f0";

  if (activeMode == "SOLID") {
      return html``;
  }

  if (loading || !modeLoaded) {
    return html`
      <div
        class="card border rounded-3"
        style="background-color: ${cardBgColor}; border-color: ${cardBorderColor} !important;"
      >
        <div class="card-body p-4 text-center">
          <div
            class="spinner-border spinner-border-sm text-primary mb-2"
            role="status"
          ></div>
          <div
            style="font-size: 0.85rem; font-weight: 600; color: ${isDarkMode ? "#94a3b8" : "#475569"};"
          >
            Loading Mode Intervals...
          </div>
        </div>
      </div>
    `;
  }

  if (!activeMode) {
    return html`
      <div
        class="card border rounded-3"
        style="background-color: ${cardBgColor}; border-color: ${cardBorderColor} !important;"
      >
        <div class="card-body p-4 text-center">
          <small
            class="fw-semibold"
            style="color: ${isDarkMode ? "#94a3b8" : "#475569"};"
            >No mode available.</small
          >
        </div>
      </div>
    `;
  }

  return html`
    <div
      class="card border rounded-3"
      style="background-color: ${cardBgColor}; border-color: ${cardBorderColor} !important;"
    >
      <div class="card-body p-3 p-md-4">
        <div class="d-flex align-items-center justify-content-between mb-3">
          <h5
            class="fw-bold text-uppercase mb-0"
            style="font-size: 0.75rem; letter-spacing: 0.05em; color: ${isDarkMode ? "#94a3b8" : "#475569"};"
          >
            <i
              class=${`fas ${getModeIcon(activeMode)} fs-6`}
              style="color: ${isDarkMode ? "#8b9bb4" : "#475569"};"
            ></i>
            <span class="ms-2">${activeMode}</span>
          </h5>

          <span
            class="badge rounded-pill fw-bold px-2.5 py-1 text-capitalize"
            style="
              font-size: 0.75rem;
              background-color: rgba(59, 130, 246, 0.15);
              color: #60a5fa;
              border: 1px solid rgba(59, 130, 246, 0.3);
            "
          >
            ${modeInterval}s
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
          Adjust the interval settings to desired speeds. ${modeInterval}
        </div>

        <!-- Custom Glow Slider -->
        <div class="my-4 position-relative">
          <input
            type="range"
            class="glow-range-input"
            min="0.01"
            max="2"
            step="0.01"
            value=${modeInterval}
            onInput=${handleIntervalChange()}
            aria-label=${`${activeMode} speed interval setting`}
            style="background: ${getTrackGradient(modeInterval)}; width: 100%;"
          />

          <div
            class="d-flex justify-content-between mt-2"
            style="
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: ${subtextColor};
                  "
          >
            <span>0.01s</span>
            <span>1.0s</span>
            <span>2.0s</span>
          </div>
        </div>
      </div>
    </div>
  `;
}
