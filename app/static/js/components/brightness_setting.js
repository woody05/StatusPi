import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import htm from 'htm';
import { getThemeStyles } from '../theme.js';

const html = htm.bind(h);

export function BrightnessSettingsControls({ isDarkMode }) {
  const theme = getThemeStyles(isDarkMode);
  const [brightness, setBrightness] = useState(0);
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef(null);

  useEffect(() => {
    fetch('/api/brightness')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch brightness data');
        return res.json();
      })
      .then((data) => {
        const val = typeof data === 'object' && data !== null ? (data.value ?? 0) : Number(data);
        setBrightness(isNaN(val) ? 0 : val);
        setLoading(false);
      })
      .catch((err) => {
        console.error('API Error:', err);
        setBrightness(0);
        setLoading(false);
      });
  }, []);

  const sendBrightnessUpdate = (newValue) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        await fetch('/api/brightness', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brightness: newValue }),
        });
      } catch (err) {
        console.error('Failed to update brightness:', err);
      }
    }, 200);
  };

  const handleBrightnessChange = (e) => {
    const newValue = parseInt(e.target.value, 10);
    setBrightness(newValue);
    sendBrightnessUpdate(newValue);
  };

  const handlePresetClick = (val) => {
    setBrightness(val);
    sendBrightnessUpdate(val);
  };

  const cardBgColor = (theme && theme.card && theme.card.backgroundColor) 
    ? theme.card.backgroundColor 
    : (isDarkMode ? '#1a2332' : '#ffffff');
    
  const cardBorderColor = (theme && theme.card && theme.card.borderColor) 
    ? theme.card.borderColor 
    : (isDarkMode ? '#27354a' : '#e2e8f0');

  const subtextColor = isDarkMode ? '#8b9bb4' : '#64748b';

  // Custom dual-tone filled gradient track
  const activeTrack = '#3b82f6';
  const inactiveTrack = isDarkMode ? '#0f172a' : '#e2e8f0';
  const trackGradient = `linear-gradient(to right, ${activeTrack} 0%, ${activeTrack} ${brightness}%, ${inactiveTrack} ${brightness}%, ${inactiveTrack} 100%)`;

  if (loading) {
    return html`
      <div class="card border rounded-3 h-100" style="background-color: ${cardBgColor}; border-color: ${cardBorderColor} !important;">
        <div class="card-body p-4 text-center d-flex flex-column justify-content-center align-items-center" style="min-height: 180px;">
          <div class="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
          <div style="font-size: 0.85rem; font-weight: 600; color: ${subtextColor};">Loading Brightness...</div>
        </div>
      </div>
    `;
  }

  return html`
    <div class="card border rounded-3 h-100" style="background-color: ${cardBgColor}; border-color: ${cardBorderColor} !important;">
      
      <!-- Custom CSS Overrides for smooth custom slider elements -->
      <style>
        .glow-range-input {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 12px;
          border-radius: 999px;
          outline: none;
          box-shadow: ${isDarkMode ? 'inset 0 2px 4px rgba(0,0,0,0.6)' : 'inset 0 1px 3px rgba(0,0,0,0.1)'};
        }

        /* Webkit (Chrome, Edge, Safari, Brave) Thumb */
        .glow-range-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #ffffff;
          border: 3px solid #3b82f6;
          cursor: pointer;
          box-shadow: 0 0 12px rgba(59, 130, 246, 0.7);
          transition: transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
        }

        .glow-range-input::-webkit-slider-thumb:hover,
        .glow-range-input::-webkit-slider-thumb:active {
          transform: scale(1.2);
          box-shadow: 0 0 18px rgba(59, 130, 246, 1);
        }

        /* Firefox Thumb */
        .glow-range-input::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #ffffff;
          border: 3px solid #3b82f6;
          cursor: pointer;
          box-shadow: 0 0 12px rgba(59, 130, 246, 0.7);
          transition: transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
        }

        .glow-range-input::-moz-range-thumb:hover,
        .glow-range-input::-moz-range-thumb:active {
          transform: scale(1.2);
          box-shadow: 0 0 18px rgba(59, 130, 246, 1);
        }
      </style>

      <div class="card-body p-3 p-md-4 d-flex flex-column justify-content-between">
        
        <!-- Header -->
        <div>
          <div class="d-flex align-items-center justify-content-between mb-3">
            <h6 class="fw-bold text-uppercase mb-0" style="font-size: 0.75rem; letter-spacing: 0.05em; color: ${subtextColor};">
              LED Brightness
            </h6>
            <span class="badge rounded-pill fw-bold px-2.5 py-1" style="font-size: 0.75rem; background-color: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3);">
              ${brightness}%
            </span>
          </div>

          <!-- Custom Glow Slider Bar -->
          <div class="my-4 position-relative">
            <input 
              type="range" 
              class="glow-range-input" 
              min="0" 
              max="100" 
              step="1"
              value=${brightness} 
              onInput=${handleBrightnessChange}
              aria-label="Display Brightness"
              style="background: ${trackGradient};"
            />
            
            <div class="d-flex justify-content-between mt-2" style="font-size: 0.75rem; font-weight: 600; color: ${subtextColor};">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        <!-- Quick Presets -->
        <div class="pt-2">
          <div class="text-uppercase mb-2 fw-semibold" style="font-size: 0.65rem; letter-spacing: 0.05em; color: ${subtextColor};">
            Quick Brightness
          </div>
          <div class="row g-1.5">
            ${[25, 50, 75, 100].map((val) => html`
              <div class="col-3" key=${val}>
                <button 
                  type="button" 
                  class="btn w-100 py-1.5 px-0 fw-semibold rounded-2 border-0" 
                  style="
                    font-size: 0.75rem;
                    background-color: ${brightness === val 
                      ? '#2563eb' 
                      : (isDarkMode ? '#111827' : '#f1f5f9')};
                    color: ${brightness === val 
                      ? '#ffffff' 
                      : (isDarkMode ? '#cbd5e1' : '#475569')};
                    transition: all 0.12s ease;
                  "
                  onClick=${() => handlePresetClick(val)}
                >
                  ${val}%
                </button>
              </div>
            `)}
          </div>
        </div>

      </div>
    </div>
  `;
}