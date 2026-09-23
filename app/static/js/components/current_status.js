import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import htm from 'htm';

const html = htm.bind(h);

export function CurrentStatus({ isDarkMode }) {
    const [status, setStatus] = useState({ id: null, name: "Unknown", color: "#6c757d" });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = () => {
            fetch('/api/status')
                .then((res) => {
                    if (!res.ok) throw new Error('Failed to fetch status data');
                    return res.json();
                })
                .then((data) => {
                    setStatus(data);
                    setLoading(false);
                })
                .catch((err) => {
                    console.error('API Error:', err);
                    setLoading(false);
                });
        };

        fetchStatus();
        const intervalId = setInterval(fetchStatus, 1000);

        return () => clearInterval(intervalId);
    }, []);

    if (loading) {
        return html`
            <div class=${`card shadow-sm border-0 mb-3 ${isDarkMode ? 'bg-secondary bg-opacity-10 text-light' : 'bg-white text-dark'}`}>
                <div class="card-body d-flex align-items-center justify-content-center p-3">
                    <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    <span class=${isDarkMode ? 'text-secondary' : 'text-muted'} style="font-size: 0.875rem;">Loading Status...</span>
                </div>
            </div>
        `;
    }

    if (!status) {
        return html`
            <div class=${`card shadow-sm border-0 mb-3 ${isDarkMode ? 'bg-secondary bg-opacity-10 text-secondary' : 'bg-light text-muted'}`}>
                <div class="card-body p-3 text-center">
                    <small>No status available.</small>
                </div>
            </div>
        `;
    }

    return html`
        <div class=${`card shadow-sm border-0 mb-3 ${isDarkMode ? 'bg-secondary bg-opacity-10 text-light' : 'bg-white text-dark'}`}>
            <div class="card-body d-flex align-items-center justify-content-between p-3">
                <span class=${`${isDarkMode ? 'text-secondary' : 'text-secondary'} fw-bold text-uppercase small`} style="letter-spacing: 0.5px;">
                    Current Status
                </span>
                <span 
                    class="badge rounded-pill fs-6 px-3 py-2 text-white shadow-sm" 
                    style="background-color: ${status.color || '#0d6efd'}; transition: background-color 0.3s ease; text-shadow: 0 1px 2px rgba(0,0,0,0.3);"
                >
                    ${status.name}
                </span>
            </div>
        </div>
    `;
}