import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import htm from 'htm';
import { getThemeStyles } from '../theme.js';

const html = htm.bind(h);

export function ModeControls({ isDarkMode }) {
    const [mode, setMode] = useState(null);
    const [modes, setModes] = useState([]);
    const [activeMode, setActiveMode] = useState('');
    const [modesLoaded, setModesLoaded] = useState(false);
    const [modeLoaded, setModeLoaded] = useState(false);
    const [connectionError, setConnectionError] = useState(false);

    const theme = getThemeStyles(isDarkMode);
    const loading = !modesLoaded || !modeLoaded;

    const getModeIcon = (modeStr) => {
        const mode = String(modeStr).toUpperCase();
        switch (mode) {
            case 'OFF': return 'fa-power-off';
            case 'SOLID': 
            case 'STATIC': return 'fa-lightbulb';
            case 'PULSE': 
            case 'WAVE':
            case 'BREATHE': return 'fa-wave-square';
            case 'RAINBOW': return 'fa-rainbow';
            case 'FLASH': 
            case 'STROBE': return 'fa-bolt';
            case 'SCATTER': return 'fa-bahai';
            default: return 'fa-sliders-h';
        }
    };

    const formatModeName = (modeStr) => {
        return String(modeStr)
            .toLowerCase()
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // One-time fetch: the list of available modes. The stream only carries
    // the currently-active mode, not the full list of options.
    useEffect(() => {
        fetch('/api/modes')
            .then((res) => {
                if (!res.ok) throw new Error('Failed to fetch mode configurations');
                return res.json();
            })
            .then((data) => {
                const modeList = Array.isArray(data) ? data : (data.modes || []);
                setModes(modeList);
                setModesLoaded(true);
            })
            .catch((err) => {
                console.error('API Error:', err);
                setModes([]);
                setModesLoaded(true);
            });
    }, []);

    // Live stream: current active mode. Payload shape isn't confirmed yet,
    // so this accepts either a bare string ("RAINBOW") or an object
    // ({ mode: "RAINBOW" } / { active: "RAINBOW" }).
    useEffect(() => {
        const eventSource = new EventSource('/api/mode/stream');

        const handleEvent = (event) => {
            try {
                const data = JSON.parse(event.data);
                setMode(data);

                const currentMode = typeof data === 'string'
                    ? data
                    : (data?.mode || data?.active);

                if (currentMode) setActiveMode(currentMode);
            } catch (err) {
                console.error('Failed to parse mode stream event:', err);
            } finally {
                setModeLoaded(true);
                setConnectionError(false);
            }
        };

        eventSource.onmessage = handleEvent;
        eventSource.onerror = (err) => {
            console.error('Mode stream error:', err);
            setConnectionError(true);
        };

        return () => {
            eventSource.close();
        };
    }, []);

    const handleSelectMode = async (modeStr) => {
        setActiveMode(modeStr);
        try {
            await fetch('/api/mode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: modeStr }),
            });
        } catch (err) {
            console.error('Failed to change mode:', err);
        }
    };

    // Fallback theme resolutions matching StatusControls
    const cardBgColor = (theme && theme.card && theme.card.backgroundColor) 
        ? theme.card.backgroundColor 
        : (isDarkMode ? '#1a2332' : '#ffffff');
        
    const cardBorderColor = (theme && theme.card && theme.card.borderColor) 
        ? theme.card.borderColor 
        : (isDarkMode ? '#27354a' : '#e2e8f0');

    if (loading) {
        return html`
            <div class="card border rounded-3" style="background-color: ${cardBgColor}; border-color: ${cardBorderColor} !important;">
                <div class="card-body p-4 text-center">
                    <div class="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
                    <div style="font-size: 0.85rem; font-weight: 600; color: ${isDarkMode ? '#94a3b8' : '#475569'};">Loading Modes...</div>
                </div>
            </div>
        `;
    }

    if (!modes || modes.length === 0) {
        return html`
            <div class="card border rounded-3" style="background-color: ${cardBgColor}; border-color: ${cardBorderColor} !important;">
                <div class="card-body p-4 text-center">
                    <small class="fw-semibold" style="color: ${isDarkMode ? '#94a3b8' : '#475569'};">No modes available.</small>
                </div>
            </div>
        `;
    }

    return html`
        <div class="card border rounded-3" style="background-color: ${cardBgColor}; border-color: ${cardBorderColor} !important;">
            <div class="card-body p-3 p-md-4">
                
                <div class="d-flex align-items-center justify-content-between mb-3">
                    <h6 class="fw-bold text-uppercase mb-0" style="font-size: 0.75rem; letter-spacing: 0.05em; color: ${isDarkMode ? '#94a3b8' : '#475569'};">
                        Display Modes
                    </h6>
                    <span class="badge rounded-pill fw-semibold" style="font-size: 0.7rem; background-color: ${isDarkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}; color: ${isDarkMode ? '#cbd5e1' : '#334155'};">
                        ${connectionError ? 'Reconnecting…' : 'Pattern Select'}
                    </span>
                </div>

                <div class="row g-2 g-sm-3">
                    ${modes.map((modeStr) => {
                        const isActive = String(activeMode).toUpperCase() === String(modeStr).toUpperCase();
                        return html`
                            <div class="col-6 col-md-3" key=${modeStr}>
                                <button 
                                    type="button"
                                    class="btn w-100 py-3 px-2 d-flex flex-column align-items-center justify-content-center gap-2 rounded-3 border-0"
                                    style="
                                        min-height: 72px;
                                        background-color: ${isActive 
                                            ? '#2563eb' 
                                            : (isDarkMode ? '#111827' : '#ffffff')};
                                        outline: ${isActive 
                                            ? '2px solid #3b82f6' 
                                            : `1px solid ${cardBorderColor}`};
                                        box-shadow: ${isActive 
                                            ? '0 4px 14px rgba(37,99,235,0.4)' 
                                            : 'none'};
                                        transition: all 0.15s ease-in-out;
                                    "
                                    onClick=${() => handleSelectMode(modeStr)}
                                >
                                    <i 
                                        class=${`fas ${getModeIcon(modeStr)} fs-5`}
                                        style="color: ${isActive ? '#ffffff' : (isDarkMode ? '#8b9bb4' : '#475569')};"
                                    ></i>
                                    <span 
                                        class="fw-bold" 
                                        style="
                                            font-size: 0.8rem; 
                                            color: ${isActive ? '#ffffff' : (isDarkMode ? '#f8fafc' : '#0f172a')};
                                        "
                                    >
                                        ${formatModeName(modeStr)}
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