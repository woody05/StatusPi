// theme.js
export const getThemeStyles = (isDarkMode) => ({
  page: {
    backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9',
    color: isDarkMode ? '#f8fafc' : '#0f172a',
    transition: 'background-color 0.2s ease',
  },
  headerBorder: {
    borderBottom: `1px solid ${isDarkMode ? '#1e293b' : '#cbd5e1'}`,
  },
  iconBox: {
    width: '44px',
    height: '44px',
    backgroundColor: isDarkMode ? 'rgba(37,99,235,0.2)' : '#2563eb',
    color: isDarkMode ? '#60a5fa' : '#ffffff',
    border: '1px solid #1d4ed8',
  },
  toggleBtn: {
    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
    border: `1px solid ${isDarkMode ? '#334155' : '#cbd5e1'}`,
    color: isDarkMode ? '#f8fafc' : '#0f172a',
    boxShadow: isDarkMode ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
    fontSize: '0.8rem',
    fontWeight: '600',
  },
});