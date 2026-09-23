import { h } from 'preact';
import htm from 'htm';

const html = htm.bind(h);

export function BottomNav({ isDarkMode, onNavigate, currentPage }) {
  if (!onNavigate) return null;

  const bg = isDarkMode ? 'rgba(26, 35, 50, 0.94)' : 'rgba(255, 255, 255, 0.94)';
  const border = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  return html`
    <!-- Spacer prevents bottom controls/cards from being hidden under fixed bar -->
    <div class="d-md-none" style="height: 70px;"></div>

    <!-- Visible ONLY on mobile (d-md-none) -->
    <nav 
      class="fixed-bottom d-md-none d-flex align-items-center justify-content-around py-2 px-3 shadow-lg"
      style="
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        background-color: ${bg};
        border-top: 1px solid ${border};
        padding-bottom: calc(0.5rem + env(safe-area-inset-bottom, 0px));
        z-index: 1030;
        user-select: none;
      "
    >
      <style>
        .mobile-tab-btn:active {
          transform: scale(0.92);
        }
      </style>

      <!-- Home Tab -->
      <button 
        type="button" 
        class="btn border-0 d-flex flex-column align-items-center gap-1 mobile-tab-btn py-1"
        style="
          color: ${currentPage === 'home' ? '#3b82f6' : (isDarkMode ? '#64748b' : '#94a3b8')};
          transition: all 0.15s ease;
          background: transparent;
          min-width: 64px;
        "
        onClick=${() => onNavigate('home')}
      >
        <i class="fas fa-house" style="font-size: 1.15rem;"></i>
        <span class="fw-bold" style="font-size: 0.7rem; letter-spacing: -0.01em;">Home</span>
      </button>

      <!-- Settings Tab -->
      <button 
        type="button" 
        class="btn border-0 d-flex flex-column align-items-center gap-1 mobile-tab-btn py-1"
        style="
          color: ${currentPage === 'settings' ? '#3b82f6' : (isDarkMode ? '#64748b' : '#94a3b8')};
          transition: all 0.15s ease;
          background: transparent;
          min-width: 64px;
        "
        onClick=${() => onNavigate('settings')}
      >
        <i class="fas fa-gear" style="font-size: 1.15rem;"></i>
        <span class="fw-bold" style="font-size: 0.7rem; letter-spacing: -0.01em;">Settings</span>
      </button>
    </nav>
  `;
}