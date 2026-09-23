import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import htm from 'htm';

const html = htm.bind(h);

export function LogViewer({ isDarkMode, endpoint = '/api/logs', onClear }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [copied, setCopied] = useState(false);

  const isDark = isDarkMode;

  // Theme tokens
  const cardBg = isDark ? '#1a2332' : '#ffffff';
  const consoleBg = isDark ? '#0b0f17' : '#f1f5f9';
  const border = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const mutedText = isDark ? '#8b9bb4' : '#64748b';

  const normalizeLevel = (level = '') => {
    const l = level.toLowerCase();
    if (l === 'warning') return 'warn';
    if (l === 'critical') return 'error';
    return l;
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const queryParts = [];

      if (filter && filter !== 'all') {
        queryParts.push(`level=${filter}`);
      }

      if (startDateTime) {
        const rawStart = startDateTime.replace('T', ' ') + (startDateTime.length === 16 ? ':00' : '');
        queryParts.push(`start_date=${rawStart}`);
      }

      if (endDateTime) {
        const rawEnd = endDateTime.replace('T', ' ') + (endDateTime.length === 16 ? ':59' : '');
        queryParts.push(`end_date=${rawEnd}`);
      }

      const queryString = queryParts.join('&');
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const responseData = await res.json();
      const logData = Array.isArray(responseData) ? responseData : (responseData.data || []);

      const formattedLogs = logData.map((log) => ({
        id: log.id || Math.random().toString(36).substring(2, 9),
        rawTimestamp: log.timestamp,
        timestamp: log.timestamp ? String(log.timestamp).split(' ')[1] || log.timestamp : '00:00:00',
        level: normalizeLevel(log.level),
        message: log.message || ''
      }));

      setLogs(formattedLogs);
      setFetchError(null);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
      setFetchError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filter, startDateTime, endDateTime, endpoint]);

  const filteredLogs = logs.filter((log) => {
    const query = searchQuery.toLowerCase();
    return log.message.toLowerCase().includes(query) || log.timestamp.includes(query);
  });

  const getBadgeStyle = (level) => {
    switch (level) {
      case 'error':
        return { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', label: 'ERR' };
      case 'warn':
        return { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', label: 'WARN' };
      default:
        return { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', label: 'INFO' };
    }
  };

  const handleCopy = () => {
    const logText = filteredLogs.map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(logText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return html`
    <style>
      /* Prevents native calendar icon duplication inside datetime inputs */
      input[type="datetime-local"]::-webkit-calendar-picker-indicator {
        background: transparent;
        bottom: 0;
        color: transparent;
        cursor: pointer;
        height: auto;
        left: 0;
        position: absolute;
        right: 0;
        top: 0;
        width: auto;
      }
      .custom-datetime-container {
        position: relative;
      }
    </style>

    <div 
      class="p-3 p-md-4 rounded-4 shadow-sm mb-4"
      style="
        background-color: ${cardBg};
        border: 1px solid ${border};
        user-select: none;
      "
    >
      <!-- Title & Actions Bar -->
      <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div class="d-flex align-items-center gap-2">
          <i class="fas fa-terminal text-primary" style="font-size: 1.1rem;"></i>
          <h6 class="mb-0 fw-bold" style="color: ${textColor}; font-size: 1rem;">System Logs</h6>
          <span 
            class="badge rounded-pill px-2 py-1"
            style="background-color: ${isDark ? '#0f172a' : '#e2e8f0'}; color: ${mutedText}; font-size: 0.7rem;"
          >
            ${filteredLogs.length} entries
          </span>
          ${fetchError && html`
            <span class="badge bg-danger-subtle text-danger" style="font-size: 0.65rem;" title=${fetchError}>
              Offline
            </span>
          `}
        </div>

        <!-- Quick Actions -->
        <div class="d-flex align-items-center gap-1.5 ms-auto">
          <button 
            type="button" 
            class="btn btn-sm border-0 d-flex align-items-center gap-1 px-2.5 py-1 rounded-2 me-2"
            style="background-color: ${isDark ? '#0f172a' : '#f1f5f9'}; color: ${textColor}; font-size: 0.75rem; font-weight: 600;"
            onClick=${fetchLogs}
            disabled=${loading}
            title="Refresh Logs"
          >
            <i class=${`fas fa-rotate ${loading ? 'fa-spin' : ''}`} style="font-size: 0.7rem;"></i>
            <span>Refresh</span>
          </button>

          <button 
            type="button" 
            class="btn btn-sm border-0 d-flex align-items-center gap-1 px-2.5 py-1 rounded-2"
            style="background-color: ${isDark ? '#0f172a' : '#f1f5f9'}; color: ${textColor}; font-size: 0.75rem; font-weight: 600;"
            onClick=${handleCopy}
            title="Copy Logs"
          >
            <i class=${`fas ${copied ? 'fa-check text-success' : 'fa-copy'}`} style="font-size: 0.7rem;"></i>
            <span>${copied ? 'Copied!' : 'Copy'}</span>
          </button>

          ${onClear && html`
            <button 
              type="button" 
              class="btn btn-sm border-0 d-flex align-items-center gap-1 px-2.5 py-1 rounded-2 text-danger"
              style="background-color: rgba(239, 68, 68, 0.1); font-size: 0.75rem; font-weight: 600;"
              onClick=${onClear}
              title="Clear Logs"
            >
              <i class="fas fa-trash-can" style="font-size: 0.7rem;"></i>
              <span class="d-none d-sm-inline">Clear</span>
            </button>
          `}
        </div>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="row g-2 mb-3">
        <!-- Search Field -->
        <div class="col-12 col-lg">
          <div 
            class="d-flex align-items-center px-2.5 py-1.5 rounded-3 border h-100"
            style="background-color: ${consoleBg}; border-color: ${border} !important;"
          >
            <i class="fas fa-magnifying-glass me-2 ms-2" style="color: ${mutedText}; font-size: 0.8rem;"></i>
            <input 
              type="text" 
              class="form-control form-control-sm border-0 p-0 bg-transparent shadow-none"
              style="color: ${textColor}; font-size: 0.8rem; height: auto;"
              placeholder="Filter logs..."
              value=${searchQuery}
              onInput=${(e) => setSearchQuery(e.target.value)}
            />
            ${searchQuery && html`
              <button 
                type="button" 
                class="btn btn-sm p-0 border-0 text-muted" 
                onClick=${() => setSearchQuery('')}
              >
                <i class="fas fa-xmark" style="font-size: 0.8rem;"></i>
              </button>
            `}
          </div>
        </div>

        <!-- Date-Time Pickers -->
        <div class="col-12 col-lg-auto">
          <div class="d-flex align-items-center gap-2 flex-wrap flex-sm-nowrap">
            <!-- Start Time Field -->
            <div 
              class="d-flex align-items-center px-3 py-1 rounded-3 border gap-2 custom-datetime-container"
              style="background-color: ${consoleBg}; border-color: ${border} !important;"
            >
              <span class="fw-bold" style="color: ${mutedText}; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap;">From</span>
              <input 
                type="datetime-local" 
                class="form-control form-control-sm border-0 bg-transparent p-0 shadow-none"
                style="color: ${textColor}; font-size: 0.75rem; width: auto; color-scheme: ${isDark ? 'dark' : 'light'};"
                value=${startDateTime}
                onChange=${(e) => setStartDateTime(e.target.value)}
                title="Start Date & Time"
              />
            </div>

            <!-- End Time Field -->
            <div 
              class="d-flex align-items-center px-3 py-1 rounded-3 border gap-2 custom-datetime-container"
              style="background-color: ${consoleBg}; border-color: ${border} !important;"
            >
              <span class="fw-bold" style="color: ${mutedText}; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap;">To</span>
              <input 
                type="datetime-local" 
                class="form-control form-control-sm border-0 bg-transparent p-0 shadow-none"
                style="color: ${textColor}; font-size: 0.75rem; width: auto; color-scheme: ${isDark ? 'dark' : 'light'};"
                value=${endDateTime}
                onChange=${(e) => setEndDateTime(e.target.value)}
                title="End Date & Time"
              />
            </div>

            <!-- Clear Range Button -->
            ${(startDateTime || endDateTime) && html`
              <button 
                type="button" 
                class="btn btn-sm border-0 px-2 py-1 rounded-3 d-flex align-items-center gap-1" 
                style="background-color: rgba(239, 68, 68, 0.1); color: #ef4444; font-size: 0.72rem; font-weight: 600;"
                onClick=${() => { setStartDateTime(''); setEndDateTime(''); }}
                title="Clear date range"
              >
                <i class="fas fa-xmark" style="font-size: 0.75rem;"></i>
                <span>Reset</span>
              </button>
            `}
          </div>
        </div>

        <!-- Level Segment Pills -->
        <div class="col-12 col-lg-auto">
          <div 
            class="d-flex align-items-center p-1 rounded-3 h-100 justify-content-between justify-content-sm-start"
            style="background-color: ${consoleBg}; border: 1px solid ${border};"
          >
            ${['all', 'info', 'warn', 'error'].map((lvl) => html`
              <button 
                type="button" 
                class="btn btn-sm border-0 px-2.5 py-1 rounded-2 text-capitalize"
                style="
                  font-size: 0.75rem;
                  font-weight: 600;
                  transition: all 0.15s ease;
                  background-color: ${filter === lvl ? (isDark ? '#253244' : '#ffffff') : 'transparent'};
                  color: ${filter === lvl ? (isDark ? '#f8fafc' : '#0f172a') : mutedText};
                  box-shadow: ${filter === lvl ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'};
                "
                onClick=${() => setFilter(lvl)}
              >
                ${lvl}
              </button>
            `)}
          </div>
        </div>
      </div>

      <!-- Terminal Console Window -->
      <div 
        class="p-3 rounded-3 font-monospace overflow-auto"
        style="
          background-color: ${consoleBg};
          border: 1px solid ${border};
          max-height: 280px;
          min-height: 180px;
          font-size: 0.78rem;
          line-height: 1.6;
        "
      >
        ${loading && logs.length === 0 ? html`
          <div class="d-flex flex-column align-items-center justify-content-center py-4 text-center" style="color: ${mutedText};">
            <div class="spinner-border spinner-border-sm mb-2 text-primary" role="status"></div>
            <span>Loading system logs...</span>
          </div>
        ` : filteredLogs.length === 0 ? html`
          <div key="empty-state" class="d-flex flex-column align-items-center justify-content-center py-4 text-center" style="color: ${mutedText};">
            <i class="fas fa-inbox mb-2" style="font-size: 1.5rem; display: inline-block;"></i>
            <span>No log entries found</span>
          </div>
        ` : filteredLogs.map((log) => {
          const badge = getBadgeStyle(log.level);
          return html`
            <div key=${log.id} class="d-flex align-items-start gap-2 mb-1.5" style="word-break: break-word;">
              <!-- Timestamp -->
              <span style="color: ${mutedText}; flex-shrink: 0; font-size: 0.72rem;">
                ${log.timestamp}
              </span>

              <!-- Badge -->
              <span 
                class="badge px-1.5 py-0.5 rounded-1 fw-bold"
                style="
                  background-color: ${badge.bg}; 
                  color: ${badge.color}; 
                  font-size: 0.65rem; 
                  flex-shrink: 0;
                  letter-spacing: 0.03em;
                "
              >
                ${badge.label}
              </span>

              <!-- Message -->
              <span style="color: ${textColor}; flex-grow: 1;">
                ${log.message}
              </span>
            </div>
          `;
        })}
      </div>

    </div>
  `;
}