/**
 * Smart Dark Engine v0.2.0 - Background Service Worker
 * Manages cross-origin stylesheet requests, global preferences, and keyboard hotkeys.
 */

const DEFAULT_SETTINGS = {
  enabled: true,
  theme: 'charcoal',
  effect: 'matte',
  effectIntensity: 50,
  customBg: '#121418',
  customSurface: '#1a1d24',
  customSurfaceElevated: '#242832',
  customText: '#e6edf3',
  customTextMuted: '#94a3b8',
  customAccent: '#58a6ff',
  brightness: 92,
  contrast: 92,
  sepia: 0,
  saturation: 100,
  mediaBrightness: 92,
  fontBoost: false,
  excludedDomains: []
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(DEFAULT_SETTINGS, (stored) => {
    chrome.storage.local.set({ ...DEFAULT_SETTINGS, ...stored });
  });
});

/**
 * Handle cross-origin CSS retrieval to bypass browser CORS on external CDNs
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'FETCH_CROSS_ORIGIN_CSS') {
    fetch(request.url, { mode: 'cors' })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((cssText) => sendResponse({ success: true, css: cssText }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

function updateBadge(tabId, url) {
  if (!url || !url.startsWith('http')) {
    chrome.action.setBadgeText({ tabId, text: '' });
    return;
  }

  try {
    const host = new URL(url).hostname.toLowerCase();
    chrome.storage.local.get(DEFAULT_SETTINGS, (settings) => {
      if (!settings.enabled) {
        chrome.action.setBadgeText({ tabId, text: 'OFF' });
        chrome.action.setBadgeBackgroundColor({ tabId, color: '#6b7280' });
        return;
      }

      const isExcluded = (settings.excludedDomains || []).some((domain) => {
        const d = domain.trim().toLowerCase();
        return host === d || host.endsWith('.' + d);
      });

      if (isExcluded) {
        chrome.action.setBadgeText({ tabId, text: 'PAUSE' });
        chrome.action.setBadgeBackgroundColor({ tabId, color: '#ef4444' });
      } else {
        chrome.action.setBadgeText({ tabId, text: '' });
      }
    });
  } catch (e) {
    chrome.action.setBadgeText({ tabId, text: '' });
  }
}

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (chrome.runtime.lastError || !tab) return;
    updateBadge(tab.id, tab.url);
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab && tab.url) {
    updateBadge(tabId, tab.url);
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-dark-mode') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs.length) return;
      const tab = tabs[0];
      if (!tab.url || !tab.url.startsWith('http')) return;

      const host = new URL(tab.url).hostname.toLowerCase();

      chrome.storage.local.get(DEFAULT_SETTINGS, (settings) => {
        let excluded = [...(settings.excludedDomains || [])];
        const index = excluded.findIndex((d) => {
          const trimmed = d.trim().toLowerCase();
          return host === trimmed || host.endsWith('.' + trimmed);
        });

        if (index >= 0) {
          excluded.splice(index, 1);
        } else {
          excluded.push(host);
        }

        const updated = { ...settings, excludedDomains: excluded };
        chrome.storage.local.set(updated, () => {
          chrome.tabs.sendMessage(tab.id, {
            action: 'UPDATE_SETTINGS',
            settings: updated
          }, () => {
            if (chrome.runtime.lastError) {
              // Ignore disconnected frame
            }
          });
          updateBadge(tab.id, tab.url);
        });
      });
    });
  }
});