import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import htm from 'htm';
import { getThemeStyles } from '../theme.js';

const html = htm.bind(h);

export function StatusControls({ isDarkMode }) {
    const [status, setStatus] = useState({ id: null, name: "Unknown", color: "#6c757d" });
    const [statuses, setStatuses] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [statusesLoaded, setStatusesLoaded] = useState(false);
    const [statusLoaded, setStatusLoaded] = useState(false);
    const [connectionError, setConnectionError] = useState(false);

    const theme = getThemeStyles(isDarkMode);
    const loading = !statusesLoaded || !statusLoaded;

    const getAccessibleColor = (colorHex) => {
        if (isDarkMode || !colorHex) return colorHex || '#0d6efd';
        const hex = colorHex.replace('#', '');
        if (hex.length !== 6) return colorHex;
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 180 ? '#d97706' : colorHex;
    };

    // One-time fetch: the list of available statuses. The stream doesn't
    // carry this, only the currently-active status.
    useEffect(() => {
        fetch('/api/statuses')
            .then((res) => {
                if (!res.ok) throw new Error('Failed to fetch statuses list');
                return res.json();
            })
            .then((data) => {
                const list = Array.isArray(data) ? data : (data.statuses || []);
                setStatuses(list);
                setStatusesLoaded(true);
            })
            .catch((err) => {
                console.error('API Error:', err);
                setStatuses([]);
                setStatusesLoaded(true);
            });
    }, []);

    // Live stream: current active status, e.g. {"id":6,"name":"Away","color":"rgb(255,255,0)"}
    useEffect(() => {
        const eventSource = new EventSource('/api/status/stream');

        const handleEvent = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data && data.id !== undefined && data.id !== null) {
                    setStatus(data);
                    setActiveId(data.id);
                }
            } catch (err) {
                console.error('Failed to parse status stream event:', err);
            } finally {
                setStatusLoaded(true);
                setConnectionError(false);
            }
        };

        eventSource.onmessage = handleEvent;
        eventSource.onerror = (err) => {
            console.error('Status stream error:', err);
            setConnectionError(true);
        };

        return () => {
            eventSource.close();
        };
    }, []);

    const handleSelectStatus = async (id) => {
        setActiveId(id);
        try {
            await fetch('/api/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id }),
            });
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    // Card background & border matching theme.js properties
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
                    <div style="font-size: 0.85rem; font-weight: 600; color: ${isDarkMode ? '#94a3b8' : '#475569'};">Loading Controls...</div>
                </div>
            </div>
        `;
    }

    if (!statuses || statuses.length === 0) {
        return html`
            <div class="card border rounded-3" style="background-color: ${cardBgColor}; border-color: ${cardBorderColor} !important;">
                <div class="card-body p-4 text-center">
                    <small class="fw-semibold" style="color: ${isDarkMode ? '#94a3b8' : '#475569'};">No hardware controls available.</small>
                </div>
            </div>
        `;
    }

    return html`
        <div class="card border rounded-3" style="background-color: ${cardBgColor}; border-color: ${cardBorderColor} !important;">
            <div class="card-body p-3 p-md-4">
                
                <div class="d-flex align-items-center justify-content-between mb-3">
                    <h6 class="fw-bold text-uppercase mb-0" style="font-size: 0.75rem; letter-spacing: 0.05em; color: ${isDarkMode ? '#94a3b8' : '#475569'};">
                        Statuses
                    </h6>
                    <span class="badge rounded-pill fw-semibold" style="font-size: 0.7rem; background-color: ${isDarkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}; color: ${isDarkMode ? '#cbd5e1' : '#334155'};">
                        ${connectionError ? 'Reconnecting…' : `${statuses.length} Channels`}
                    </span>
                </div>

                <div class="row g-2 g-sm-3">
                    ${statuses.map((control) => {
                        const isActive = activeId === control.id;
                        const accentColor = getAccessibleColor(control.color);

                        return html`
                            <div class="col-12 col-sm-4" key=${control.id}>
                                <button 
                                    type="button"
                                    class="btn w-100 py-3 px-3 text-start position-relative overflow-hidden rounded-3 border-0"
                                    style="
                                        min-height: 52px;
                                        background-color: ${isDarkMode 
                                            ? (isActive ? '#253244' : '#111827') 
                                            : (isActive ? '#f8fafc' : '#ffffff')};
                                        outline: ${isActive ? `2px solid ${accentColor}` : `1px solid ${cardBorderColor}`};
                                        box-shadow: ${isActive ? `0 0 12px ${accentColor}33` : 'none'};
                                        transition: all 0.15s ease-in-out;
                                    "
                                    onClick=${() => handleSelectStatus(control.id)}
                                >
                                    <div 
                                        class="position-absolute top-0 start-0 bottom-0" 
                                        style="
                                            width: 4px; 
                                            background-color: ${accentColor};
                                            opacity: ${isActive ? '1' : '0.5'};
                                        "
                                    ></div>

                                    <div class="ps-2 d-flex align-items-center justify-content-between">
                                        <span 
                                            class="fw-bold text-truncate me-2" 
                                            style="
                                                font-size: 0.875rem; 
                                                color: ${isDarkMode ? '#f8fafc' : '#0f172a'};
                                            "
                                        >
                                            ${control.name}
                                        </span>

                                        <span 
                                            class="rounded-circle d-inline-block flex-shrink-0"
                                            style="
                                                width: 8px; 
                                                height: 8px; 
                                                background-color: ${accentColor};
                                                box-shadow: ${isActive ? `0 0 6px ${accentColor}` : 'none'};
                                            "
                                        ></span>
                                    </div>
                                </button>
                            </div>
                        `;
                    })}
                </div>
            </div>
        </div>
    `;
}