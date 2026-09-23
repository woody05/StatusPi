import { h } from 'preact';
import htm from 'htm';
import { Header } from './header.js';
import { StatusControls } from './status_controls.js';
import { ModeControls } from './mode_controls.js';
import { BrightnessSettingsControls } from './brightness_setting.js';
import { getThemeStyles } from '../theme.js';

const html = htm.bind(h);

export function HomePage({ isDarkMode, onToggleTheme, onNavigate }) {
  const theme = getThemeStyles(isDarkMode);

  return html`
    <div class="min-vh-100 py-2 py-sm-4" style=${theme.page}>
      <main class="container px-3 px-sm-4">


        <div class="row g-3 g-md-4 mt-1">
          <div class="col-12 col-lg-8 d-flex flex-column gap-3 gap-md-4">
            <${StatusControls} isDarkMode=${isDarkMode} />
            <${ModeControls} isDarkMode=${isDarkMode} />
          </div>

          <div class="col-12 col-lg-4">
            <${BrightnessSettingsControls} isDarkMode=${isDarkMode} />
          </div>
        </div>
      </main>
    </div>
  `;
}