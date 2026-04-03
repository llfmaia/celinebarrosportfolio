/**
 * Theme: respects saved preference, else prefers-color-scheme.
 * Click .theme-toggle to persist choice in localStorage.
 */
(function () {
  var STORAGE_KEY = 'theme';

  function getStored() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  function getEffectiveTheme() {
    var s = getStored();
    if (s === 'light' || s === 'dark') return s;
    return getSystemTheme();
  }

  function isPortugueseUi() {
    return document.documentElement.getAttribute('data-lang') === 'pt';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme =
      theme === 'dark' ? 'dark' : 'light';

    var dark = theme === 'dark';
    var pt = isPortugueseUi();
    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
      if (pt) {
        btn.setAttribute(
          'aria-label',
          dark ? 'Alternar para modo claro' : 'Alternar para modo escuro'
        );
        btn.setAttribute(
          'title',
          dark ? 'Alternar para modo claro' : 'Alternar para modo escuro'
        );
      } else {
        btn.setAttribute(
          'aria-label',
          dark ? 'Switch to light mode' : 'Switch to dark mode'
        );
        btn.setAttribute(
          'title',
          dark ? 'Switch to light mode' : 'Switch to dark mode'
        );
      }
    });
  }

  function init() {
    applyTheme(getEffectiveTheme());
  }

  function toggle() {
    var current =
      document.documentElement.getAttribute('data-theme') || 'light';
    var next = current === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (e) {}
    applyTheme(next);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('.theme-toggle')) {
      e.preventDefault();
      toggle();
    }
  });

  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', function () {
      if (!getStored()) applyTheme(getSystemTheme());
    });

  document.addEventListener('site-lang-change', function () {
    applyTheme(getEffectiveTheme());
  });
})();
