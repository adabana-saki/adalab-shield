// adalab shield network-level block page
// Shows what was blocked + the adalab focus countdown, and returns to the
// original URL automatically once blocking is lifted (e.g. a break starts).
/* global chrome */
(() => {
  const params = new URLSearchParams(location.search);
  const platform = params.get('p') || 'This site';
  // Everything after "u=" is the original URL (it may contain & characters)
  const rawSearch = location.search;
  const uIndex = rawSearch.indexOf('u=');
  const originalUrl =
    uIndex >= 0 ? decodeURIComponent(rawSearch.slice(uIndex + 2)) : null;

  const t = (key, fallback) => {
    try {
      const m = chrome.i18n.getMessage(key);
      return m || fallback;
    } catch {
      return fallback;
    }
  };

  // Default heading/message (the user's custom values override these below).
  document.getElementById('title').textContent = t(
    'blockPageDefaultTitle',
    'Content Blocked'
  );
  document.getElementById('message').textContent = `${platform} ${t(
    'blockedPageMessageSuffix',
    'is blocked to help you stay focused.'
  )}`;
  document.getElementById('hint').textContent = t(
    'blockPageSettingsHint',
    'You can change this in adalab shield settings.'
  );

  // Use the real extension icon instead of an emoji.
  try {
    document.getElementById('icon').src =
      chrome.runtime.getURL('icons/icon-128.png');
  } catch {
    // getURL unavailable: leave the icon empty
  }

  // Apply the user's block-page customization (theme / accent / custom text).
  const SETTINGS_KEY = 'shortshield_settings';
  const applyTheme = (theme) => {
    let dark;
    if (theme === 'dark') {
      dark = true;
    } else if (theme === 'light') {
      dark = false;
    } else {
      dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    document.body.classList.toggle('dark', dark);
  };
  applyTheme('system'); // sensible default before settings load
  void (async () => {
    try {
      const r = await chrome.storage.local.get(SETTINGS_KEY);
      const bp = r[SETTINGS_KEY] && r[SETTINGS_KEY].blockPage;
      if (!bp) return;
      applyTheme(bp.theme);
      if (typeof bp.title === 'string' && bp.title.trim()) {
        document.getElementById('title').textContent = bp.title;
      }
      if (typeof bp.message === 'string' && bp.message.trim()) {
        document.getElementById('message').textContent = bp.message;
      }
      if (typeof bp.primaryColor === 'string') {
        document.getElementById('adalab').style.borderColor = bp.primaryColor;
      }
    } catch {
      // storage unavailable: keep defaults
    }
  })();
  document.getElementById('adalab-label').textContent = t(
    'blockPageFocusRemaining',
    'Focus — time remaining'
  );

  const POMODORO_KEY = 'shortshield_pomodoro_state';
  const META_KEY = 'shortshield_adalab_meta';

  let endTime = null;

  const renderCountdown = () => {
    const el = document.getElementById('adalab-time');
    if (endTime === null) return;
    const rem = Math.max(0, Math.round((endTime - Date.now()) / 1000));
    const m = String(Math.floor(rem / 60)).padStart(2, '0');
    const s = String(rem % 60).padStart(2, '0');
    el.textContent = `${m}:${s}`;
  };

  const refresh = async () => {
    try {
      const r = await chrome.storage.local.get([POMODORO_KEY, META_KEY]);
      const pomo = r[POMODORO_KEY];
      const meta = r[META_KEY];
      const box = document.getElementById('adalab');
      // A paused break still counts as a break (pausing must not re-block)
      const inBreak =
        pomo && (pomo.mode === 'break' || pomo.mode === 'longBreak');

      if (inBreak && originalUrl && /^https?:\/\//.test(originalUrl)) {
        // Blocking lifted for the break: go back to where the user wanted
        location.replace(originalUrl);
        return;
      }

      if (pomo && pomo.isRunning && pomo.mode === 'work' && pomo.endTime) {
        endTime = pomo.endTime;
        const task =
          meta && typeof meta.taskTitle === 'string' ? meta.taskTitle : '';
        document.getElementById('adalab-task').textContent = task
          ? `${t('blockPageWorkingOn', 'Working on')}: ${task}`
          : '';
        box.style.display = 'block';
        renderCountdown();
      } else {
        endTime = null;
        box.style.display = 'none';
      }
    } catch {
      // storage unavailable: static page only
    }
  };

  void refresh();
  setInterval(renderCountdown, 1000);
  setInterval(() => void refresh(), 2000);
})();
