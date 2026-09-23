import { h } from 'preact';
import { useState } from 'preact/hooks';
import htm from 'htm';
import { Header } from './header.js';
import { getThemeStyles } from '../theme.js';
import { DefaultBrightnessSettingsControls } from './default_brightness_setting.js';
import { LogViewer } from './log_viewer.js';
import { DefaultModeSetting } from './default_mode_setting.js';
import { ModeIntervalsSetting } from './default_mode_intervals_setting.js'
import { AddStatusSetting } from './add_status_setting.js';

const html = htm.bind(h);

const SECTIONS = [
  { id: 'mode-intervals', label: 'Mode Intervals', icon: '⏱️' },
  { id: 'default-mode', label: 'Default Mode', icon: '⚙️' },
  { id: 'add-status', label: 'Add Status', icon: '➕' },
  { id: 'brightness', label: 'Default Brightness', icon: '🔆' },
  { id: 'logs', label: 'Logs', icon: '📋' },
];

function SettingsNav({ isDarkMode, activeId, onSelect }) {
  const navBg = isDarkMode ? '#0f172a' : '#f8fafc';
  const navBorder = isDarkMode ? '#334155' : '#e2e8f0';

  return html`
    <nav
      class="d-flex flex-column py-2"
      style=${{
        backgroundColor: navBg,
        borderRight: `1px solid ${navBorder}`,
        minWidth: '220px',
        width: '220px',
      }}
    >
      ${SECTIONS.map((section) => {
        const isActive = section.id === activeId;
        return html`
          <button
            key=${section.id}
            onClick=${() => onSelect(section.id)}
            class="d-flex align-items-center gap-2 border-0 text-start px-3 py-2 mx-2 my-1"
            style=${{
              backgroundColor: isActive
                ? (isDarkMode ? '#334155' : '#e2e8f0')
                : 'transparent',
              color: isActive
                ? (isDarkMode ? '#f8fafc' : '#0f172a')
                : (isDarkMode ? '#cbd5e1' : '#475569'),
              borderRadius: '999px',
              fontWeight: isActive ? '600' : '400',
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease-in-out',
            }}
          >
            <span>${section.icon}</span>
            <span>${section.label}</span>
          </button>
        `;
      })}
    </nav>
  `;
}

export function SettingsPage({ isDarkMode, onToggleTheme, onNavigate }) {
  const theme = getThemeStyles(isDarkMode);

  const [activeSection, setActiveSection] = useState('mode-intervals');
  const [deviceIp, setDeviceIp] = useState('192.168.1.100');
  const [refreshInterval, setRefreshInterval] = useState('5');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    console.log('Saved settings:', { deviceIp, refreshInterval, notificationsEnabled });
  };

  const cardStyle = {
    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
    border: `1px solid ${isDarkMode ? '#334155' : '#cbd5e1'}`,
    color: isDarkMode ? '#f8fafc' : '#0f172a',
  };

  const labelStyle = {
    color: isDarkMode ? '#cbd5e1' : '#475569',
  };

  const inputStyle = {
    backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
    color: isDarkMode ? '#f8fafc' : '#0f172a',
    borderColor: isDarkMode ? '#334155' : '#cbd5e1',
  };

  const sectionTitle = SECTIONS.find((s) => s.id === activeSection)?.label ?? '';

  return html`

        <style>
        .glow-range-input {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 12px;
          border-radius: 999px;
          outline: none;
          box-shadow: ${isDarkMode
? 'inset 0 2px 4px rgba(0,0,0,0.6)'
: 'inset 0 1px 3px rgba(0,0,0,0.1)'};
        }

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
          transition:
            transform 0.15s ease-in-out,
            box-shadow 0.15s ease-in-out;
        }

        .glow-range-input::-webkit-slider-thumb:hover,
        .glow-range-input::-webkit-slider-thumb:active {
          transform: scale(1.2);
          box-shadow: 0 0 18px rgba(59, 130, 246, 1);
        }

        .glow-range-input::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #ffffff;
          border: 3px solid #3b82f6;
          cursor: pointer;
          box-shadow: 0 0 12px rgba(59, 130, 246, 0.7);
          transition:
            transform 0.15s ease-in-out,
            box-shadow 0.15s ease-in-out;
        }

        .glow-range-input::-moz-range-thumb:hover,
        .glow-range-input::-moz-range-thumb:active {
          transform: scale(1.2);
          box-shadow: 0 0 18px rgba(59, 130, 246, 1);
        }

        .settings-content-tight > * {
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
        }

        @media (max-width: 768px) {
          .settings-layout {
            flex-direction: column;
          }
          .settings-nav {
            width: 100% !important;
            min-width: 100% !important;
            flex-direction: row !important;
            overflow-x: auto;
            border-right: none !important;
          }
        }
      </style>

    <div class="min-vh-100" style=${theme.page}>
      <main class="container-fluid px-0">
        <div class="d-flex settings-layout" style=${{ minHeight: '100vh' }}>
          <div class="settings-nav">
            <${SettingsNav}
              isDarkMode=${isDarkMode}
              activeId=${activeSection}
              onSelect=${setActiveSection}
            />
          </div>
          <div class="flex-grow-1 p-4">
            <h4 class="mb-4" style=${{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>
              ${sectionTitle}
            </h4>

            <div class="settings-content-tight">
              ${activeSection === 'mode-intervals' && html`
                <${ModeIntervalsSetting} isDarkMode=${isDarkMode} />
              `}
              ${activeSection === 'default-mode' && html`
                <${DefaultModeSetting} isDarkMode=${isDarkMode} />
              `}
              ${activeSection === 'add-status' && html`
                <${AddStatusSetting} isDarkMode=${isDarkMode} />
              `}
              ${activeSection === 'brightness' && html`
                <${DefaultBrightnessSettingsControls} isDarkMode=${isDarkMode} />
              `}
              ${activeSection === 'logs' && html`
                <${LogViewer} isDarkMode=${isDarkMode} />
              `}
            </div>
          </div>
        </div>
      </main>
    </div>
`;
}