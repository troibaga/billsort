const storageKey = 'billwise.theme';

export function isDarkMode() {
  return document.documentElement.dataset.theme === 'dark';
}

export function subscribeTheme(listener: () => void) {
  window.addEventListener('billwise-theme-change', listener);
  return () => window.removeEventListener('billwise-theme-change', listener);
}

function applyDarkMode(enabled: boolean) {
  document.documentElement.dataset.theme = enabled ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', enabled ? '#111824' : '#3456d5');
  window.dispatchEvent(new Event('billwise-theme-change'));
}

function restoreTheme() {
  try { applyDarkMode(localStorage.getItem(storageKey) === 'dark'); }
  catch { /* The default theme works when browser storage is unavailable. */ }
}

export function initializeTheme() {
  restoreTheme();
  window.addEventListener('storage', event => {
    if (event.key === storageKey || event.key === null) restoreTheme();
  });
}

export function setDarkMode(enabled: boolean) {
  applyDarkMode(enabled);
  try { localStorage.setItem(storageKey, enabled ? 'dark' : 'light'); }
  catch { /* Keep the selected theme for this visit. */ }
}
