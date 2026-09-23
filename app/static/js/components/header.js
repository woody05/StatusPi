import { h } from 'preact';
import htm from 'htm';

const html = htm.bind(h);

export function Header({ isDarkMode, onToggleTheme, title = "StatusPi", currentPage, onNavigate }) {
  const isDark = isDarkMode;

  const bg = isDark ? '#1a2332' : '#ffffff';
  const border = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const mutedText = isDark ? '#8b9bb4' : '#64748b';

  return html`
    <header 
      class="p-3 mb-3 mb-md-4 rounded-4 d-flex align-items-center justify-content-between shadow-sm"
      style="
        background-color: ${bg};
        border: 1px solid ${border};
        user-select: none;
      "
    >
      <!-- Left: Logo & Status -->
      <div class="d-flex align-items-center gap-2.5">
        <div 
          class="d-flex align-items-center justify-content-center me-2"
          style="
            width: 38px;
            height: 38px;
            border-radius: 12px;
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: #ffffff;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
            flex-shrink: 0;
          "
        >
          <i class="fas fa-lightbulb" style="font-size: 0.95rem;"></i>
        </div>

        <div class="d-flex flex-column">
          <div class="d-flex align-items-center gap-1.5">
            <span class="fw-bold" style="font-size: 1rem; color: ${textColor}; line-height: 1.1;">
              ${title}
            </span>
          </div>
          <span style="font-size: 0.7rem; font-weight: 600; color: ${mutedText};">
            Device Control
          </span>
        </div>
      </div>

      <!-- Right: Desktop Nav & Theme Toggle -->
      <div class="d-flex align-items-center gap-2">
        
        <!-- Hidden on Mobile, Visible on Desktop (d-none d-md-flex) -->
        ${onNavigate && html`
          <nav 
            class="d-none d-md-flex align-items-center p-1 rounded-3"
            style="background-color: ${isDark ? '#0f172a' : '#f1f5f9'}; border: 1px solid ${border};"
          >
            <button 
              type="button" 
              class="btn btn-sm border-0 d-flex align-items-center gap-2 px-3 py-1.5 rounded-2"
              style="
                font-size: 0.825rem;
                font-weight: 600;
                transition: all 0.15s ease;
                background-color: ${currentPage === 'home' ? '#2563eb' : 'transparent'};
                color: ${currentPage === 'home' ? '#ffffff' : mutedText};
              "
              onClick=${() => onNavigate('home')}
            >
              <i class="fas fa-house" style="font-size: 0.8rem;"></i>
              <span>Home</span>
            </button>

            <button 
              type="button" 
              class="btn btn-sm border-0 d-flex align-items-center gap-2 px-3 py-1.5 rounded-2"
              style="
                font-size: 0.825rem;
                font-weight: 600;
                transition: all 0.15s ease;
                background-color: ${currentPage === 'settings' ? '#2563eb' : 'transparent'};
                color: ${currentPage === 'settings' ? '#ffffff' : mutedText};
              "
              onClick=${() => onNavigate('settings')}
            >
              <i class="fas fa-gear" style="font-size: 0.8rem;"></i>
              <span>Settings</span>
            </button>
          </nav>
        `}

        <!-- Theme Toggle -->
        <button 
          type="button"
          class="btn d-flex align-items-center justify-content-center p-0 border-0"
          style="
            width: 38px;
            height: 38px;
            border-radius: 10px;
            background-color: ${isDark ? '#0f172a' : '#f1f5f9'};
            border: 1px solid ${border};
            color: ${textColor};
          "
          onClick=${onToggleTheme}
          aria-label="Toggle Theme"
        >
          <i class=${`fas ${isDark ? 'fa-sun text-warning' : 'fa-moon text-primary'}`} style="font-size: 0.9rem;"></i>
        </button>

      </div>
    </header>
  `;
}