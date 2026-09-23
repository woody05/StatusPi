import { h, render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import htm from 'htm';
import { Header } from './components/header.js';
import { BottomNav } from './components/bottom_nav.js';
import { HomePage } from './components/home_page.js';
import { SettingsPage } from './components/settings_page.js';

const html = htm.bind(h);

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('statuspi_theme');
    return saved !== null ? saved === 'dark' : true;
  });

  useEffect(() => {
    localStorage.setItem('statuspi_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  return html`
    <div 
      class="min-vh-100 py-2 py-md-4 px-2 px-md-3 d-flex flex-column" 
      style="
        background-color: ${isDarkMode ? '#0b0f17' : '#f8fafc'}; 
        color: ${isDarkMode ? '#f8fafc' : '#0f172a'};
        transition: background-color 0.2s ease;
      "
    >
      <!-- Centered Max-Width Shell -->
      <div class="container-xl p-0 flex-grow-1" style="margin: 0 auto; width: 100%;">
        
        <!-- Header (Nav visible on Desktop, hidden on Mobile) -->
        <${Header} 
          isDarkMode=${isDarkMode} 
          onToggleTheme=${toggleTheme} 
          title="StatusPi" 
          currentPage=${currentPage}
          onNavigate=${setCurrentPage}
        />

        <!-- Main Content -->
        <main class="w-100">
          ${currentPage === 'home' 
            ? html`<${HomePage} isDarkMode=${isDarkMode} />`
            : html`<${SettingsPage} isDarkMode=${isDarkMode} />`
          }
        </main>

      </div>

      <!-- Bottom Nav (Visible ONLY on Mobile screens) -->
      <${BottomNav} 
        isDarkMode=${isDarkMode} 
        currentPage=${currentPage} 
        onNavigate=${setCurrentPage} 
      />
    </div>
  `;
}

render(html`<${App} />`, document.getElementById('app'));