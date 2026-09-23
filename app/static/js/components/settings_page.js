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

export function SettingsPage({ isDarkMode, onToggleTheme, onNavigate }) {
  const theme = getThemeStyles(isDarkMode);

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
      </style>

    <div class="min-vh-100 py-4" style=${theme.page}>
      <main class="container">
        <div class="my-3">
            <${ModeIntervalsSetting} isDarkMode=${isDarkMode} />
        </div>
        <div class="my-3">
            <${DefaultModeSetting} isDarkMode=${isDarkMode} />
        </div>
        <div class="my-3">
            <${AddStatusSetting} isDarkMode=${isDarkMode} />
        </div>
        <div class="my-3">
            <${DefaultBrightnessSettingsControls} isDarkMode=${isDarkMode} />
        </div>
        <div class="my-3">
            <${LogViewer} isDarkMode=${isDarkMode} />
        </div>
      </main>
    </div>
  `;
}