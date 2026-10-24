/**
 * Smart Dark Engine v0.1.0 - Popup Controller
 * Manages tabbed navigation, 6 theme presets, 6-color custom studio,
 * inspiration seed palettes, 5 atmosphere effects, and visual calibration.
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

const THEME_PRESETS = {
  charcoal: {
    bg: '#121418',
    surface: '#1a1d24',
    surfaceElevated: '#242832',
    text: '#e6edf3',
    textMuted: '#94a3b8',
    accent: '#58a6ff',
    brightness: 92,
    contrast: 92,
    sepia: 0,
    saturation: 100
  },
  oled: {
    bg: '#000000',
    surface: '#0c0c0c',
    surfaceElevated: '#171717',
    text: '#f1f1f1',
    textMuted: '#a3a3a3',
    accent: '#38bdf8',
    brightness: 100,
    contrast: 100,
    sepia: 0,
    saturation: 100
  },
  midnight: {
    bg: '#0b0f19',
    surface: '#111827',
    surfaceElevated: '#1a2234',
    text: '#e5edff',
    textMuted: '#94a3b8',
    accent: '#60a5fa',
    brightness: 90,
    contrast: 95,
    sepia: 4,
    saturation: 105
  },
  warm: {
    bg: '#181512',
    surface: '#221e19',
    surfaceElevated: '#2c2620',
    text: '#ede4d8',
    textMuted: '#bfae9b',
    accent: '#f59e0b',
    brightness: 88,
    contrast: 90,
    sepia: 28,
    saturation: 90
  },
  forest: {
    bg: '#101713',
    surface: '#18221c',
    surfaceElevated: '#202d25',
    text: '#e1ece5',
    textMuted: '#9cb5a5',
    accent: '#34d399',
    brightness: 90,
    contrast: 92,
    sepia: 8,
    saturation: 95
  },
  cyberpunk: {
    bg: '#120e1f',
    surface: '#1a142e',
    surfaceElevated: '#241b3f',
    text: '#f5f3ff',
    textMuted: '#a78bfa',
    accent: '#ec4899',
    brightness: 92,
    contrast: 95,
    sepia: 0,
    saturation: 120
  }
};

const INSPIRATION_SEEDS = {
  gold: {
    bg: '#14120e',
    surface: '#1e1a14',
    surfaceElevated: '#29241c',
    text: '#fbf5ec',
    textMuted: '#b8a892',
    accent: '#eab308'
  },
  amethyst: {
    bg: '#140f1d',
    surface: '#1d162a',
    surfaceElevated: '#281e3a',
    text: '#f3e8ff',
    textMuted: '#c084fc',
    accent: '#a855f7'
  },
  ocean: {
    bg: '#0a141d',
    surface: '#101f2e',
    surfaceElevated: '#172b3e',
    text: '#e0f2fe',
    textMuted: '#7dd3fc',
    accent: '#0ea5e9'
  },
  crimson: {
    bg: '#180e10',
    surface: '#241417',
    surfaceElevated: '#311b20',
    text: '#ffe4e6',
    textMuted: '#fda4af',
    accent: '#f43f5e'
  },
  matrix: {
    bg: '#0a120c',
    surface: '#101c13',
    surfaceElevated: '#17291c',
    text: '#dcfce7',
    textMuted: '#86efac',
    accent: '#22c55e'
  }
};

document.addEventListener('DOMContentLoaded', () => {
  let currentSettings = { ...DEFAULT_SETTINGS };
  let currentHost = '';
  let activeTabId = null;

  // Header & Domain Controls
  const masterToggle = document.getElementById('masterToggle');
  const domainToggle = document.getElementById('domainToggle');
  const currentDomainEl = document.getElementById('currentDomain');
  const statusPill = document.getElementById('statusPill');
  const domainSubtitle = document.getElementById('domainSubtitle');

  // Live Preview Elements
  const livePreviewSurface = document.getElementById('livePreviewSurface');

  // Navigation Tabs
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  // Theme & Preset Controls
  const themeButtons = document.querySelectorAll('.theme-btn');
  const seedButtons = document.querySelectorAll('.seed-pill');

  // Custom Studio Inputs
  const customBgInput = document.getElementById('customBgInput');
  const customBgHex = document.getElementById('customBgHex');
  const customSurfaceInput = document.getElementById('customSurfaceInput');
  const customSurfaceHex = document.getElementById('customSurfaceHex');
  const customElevatedInput = document.getElementById('customElevatedInput');
  const customElevatedHex = document.getElementById('customElevatedHex');
  const customTextInput = document.getElementById('customTextInput');
  const customTextHex = document.getElementById('customTextHex');
  const customMutedInput = document.getElementById('customMutedInput');
  const customMutedHex = document.getElementById('customMutedHex');
  const customAccentInput = document.getElementById('customAccentInput');
  const customAccentHex = document.getElementById('customAccentHex');

  // Atmosphere Elements
  const atmosphereCards = document.querySelectorAll('.atmosphere-card');
  const effectIntensityInput = document.getElementById('effectIntensityInput');
  const effectIntensityVal = document.getElementById('effectIntensityVal');

  // Calibration Sliders
  const brightnessInput = document.getElementById('brightnessInput');
  const brightnessVal = document.getElementById('brightnessVal');
  const contrastInput = document.getElementById('contrastInput');
  const contrastVal = document.getElementById('contrastVal');
  const sepiaInput = document.getElementById('sepiaInput');
  const sepiaVal = document.getElementById('sepiaVal');
  const saturationInput = document.getElementById('saturationInput');
  const saturationVal = document.getElementById('saturationVal');
  const mediaBrightnessInput = document.getElementById('mediaBrightnessInput');
  const mediaBrightnessVal = document.getElementById('mediaBrightnessVal');
  const fontBoostInput = document.getElementById('fontBoostInput');
  const resetBtn = document.getElementById('resetBtn');

  // Query Active Tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs.length) return;
    const tab = tabs[0];
    activeTabId = tab.id;

    if (tab.url && tab.url.startsWith('http')) {
      try {
        currentHost = new URL(tab.url).hostname.toLowerCase();
        currentDomainEl.textContent = currentHost;
      } catch (e) {
        currentDomainEl.textContent = 'Active Page';
      }

      chrome.tabs.sendMessage(tab.id, { action: 'GET_TAB_STATUS' }, (res) => {
        if (!chrome.runtime.lastError && res) {
          updateStatusBadge();
        }
      });
    } else {
      currentDomainEl.textContent = 'Protected Page';
      domainToggle.disabled = true;
    }

    loadSettings();
  });

  function loadSettings() {
    chrome.storage.local.get(DEFAULT_SETTINGS, (stored) => {
      currentSettings = { ...DEFAULT_SETTINGS, ...stored };
      updateUI();
    });
  }

  function updateStatusBadge() {
    const isExcluded = (currentSettings.excludedDomains || []).some((d) => {
      const trimmed = d.trim().toLowerCase();
      return currentHost === trimmed || currentHost.endsWith('.' + trimmed);
    });

    if (!currentSettings.enabled || isExcluded) {
      statusPill.textContent = 'Paused';
      statusPill.className = 'status-pill paused';
      domainSubtitle.textContent = 'Excluded or Paused';
    } else {
      statusPill.textContent = 'Active';
      statusPill.className = 'status-pill active';
      domainSubtitle.textContent = 'HSL Compiled Mode';
    }
  }

  function updateLivePreview() {
    let pBg = currentSettings.customBg || '#121418';
    let pSurface = currentSettings.customSurface || '#1a1d24';
    let pText = currentSettings.customText || '#e6edf3';
    let pMuted = currentSettings.customTextMuted || '#94a3b8';
    let pAccent = currentSettings.customAccent || '#58a6ff';

    if (currentSettings.theme !== 'custom' && THEME_PRESETS[currentSettings.theme]) {
      const preset = THEME_PRESETS[currentSettings.theme];
      pBg = preset.bg;
      pSurface = preset.surface;
      pText = preset.text;
      pMuted = preset.textMuted;
      pAccent = preset.accent;
    }

    if (livePreviewSurface) {
      livePreviewSurface.style.setProperty('--preview-bg', pBg);
      livePreviewSurface.style.setProperty('--preview-surface', pSurface);
      livePreviewSurface.style.setProperty('--preview-text', pText);
      livePreviewSurface.style.setProperty('--preview-muted', pMuted);
      livePreviewSurface.style.setProperty('--preview-accent', pAccent);
    }
  }

  function updateUI() {
    masterToggle.checked = !!currentSettings.enabled;

    if (currentHost) {
      const isExcluded = (currentSettings.excludedDomains || []).some((d) => {
        const trimmed = d.trim().toLowerCase();
        return currentHost === trimmed || currentHost.endsWith('.' + trimmed);
      });
      domainToggle.checked = !isExcluded;
    }

    // Theme Preset Buttons
    themeButtons.forEach((btn) => {
      if (btn.dataset.theme === currentSettings.theme) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Custom Color Studio Inputs
    customBgInput.value = currentSettings.customBg || '#121418';
    customBgHex.textContent = currentSettings.customBg || '#121418';

    customSurfaceInput.value = currentSettings.customSurface || '#1a1d24';
    customSurfaceHex.textContent = currentSettings.customSurface || '#1a1d24';

    customElevatedInput.value = currentSettings.customSurfaceElevated || '#242832';
    customElevatedHex.textContent = currentSettings.customSurfaceElevated || '#242832';

    customTextInput.value = currentSettings.customText || '#e6edf3';
    customTextHex.textContent = currentSettings.customText || '#e6edf3';

    customMutedInput.value = currentSettings.customTextMuted || '#94a3b8';
    customMutedHex.textContent = currentSettings.customTextMuted || '#94a3b8';

    customAccentInput.value = currentSettings.customAccent || '#58a6ff';
    customAccentHex.textContent = currentSettings.customAccent || '#58a6ff';

    // Atmosphere Effects
    const activeEffect = currentSettings.effect || 'matte';
    atmosphereCards.forEach((card) => {
      if (card.dataset.effect === activeEffect) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    effectIntensityInput.value = currentSettings.effectIntensity || 50;
    effectIntensityVal.textContent = `${currentSettings.effectIntensity || 50}%`;

    // Visual Calibration Sliders
    brightnessInput.value = currentSettings.brightness;
    brightnessVal.textContent = `${currentSettings.brightness}%`;

    contrastInput.value = currentSettings.contrast;
    contrastVal.textContent = `${currentSettings.contrast}%`;

    sepiaInput.value = currentSettings.sepia;
    sepiaVal.textContent = `${currentSettings.sepia}%`;

    saturationInput.value = currentSettings.saturation !== undefined ? currentSettings.saturation : 100;
    saturationVal.textContent = `${saturationInput.value}%`;

    mediaBrightnessInput.value = currentSettings.mediaBrightness;
    mediaBrightnessVal.textContent = `${currentSettings.mediaBrightness}%`;

    fontBoostInput.checked = !!currentSettings.fontBoost;

    updateLivePreview();
    updateStatusBadge();
  }

  function saveAndDispatch() {
    chrome.storage.local.set(currentSettings, () => {
      updateStatusBadge();
      updateLivePreview();
      if (activeTabId) {
        chrome.tabs.sendMessage(activeTabId, {
          action: 'UPDATE_SETTINGS',
          settings: currentSettings
        }, () => {
          if (chrome.runtime.lastError) {
            // Non-responsive frame or internal tab
          }
        });
      }
    });
  }

  // Navigation Tab Switching
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.tab;
      tabButtons.forEach((b) => b.classList.remove('active'));
      tabPanes.forEach((p) => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  // Master Global Switch
  masterToggle.addEventListener('change', () => {
    currentSettings.enabled = masterToggle.checked;
    saveAndDispatch();
  });

  // Per-Domain Toggle
  domainToggle.addEventListener('change', () => {
    if (!currentHost) return;
    let list = [...(currentSettings.excludedDomains || [])];
    const index = list.findIndex((d) => {
      const trimmed = d.trim().toLowerCase();
      return currentHost === trimmed || currentHost.endsWith('.' + trimmed);
    });

    if (domainToggle.checked) {
      if (index >= 0) list.splice(index, 1);
    } else {
      if (index === -1) list.push(currentHost);
    }

    currentSettings.excludedDomains = list;
    saveAndDispatch();
  });

  // Theme Preset Buttons
  themeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const selectedTheme = btn.dataset.theme;
      currentSettings.theme = selectedTheme;

      const preset = THEME_PRESETS[selectedTheme];
      if (preset) {
        currentSettings.brightness = preset.brightness;
        currentSettings.contrast = preset.contrast;
        currentSettings.sepia = preset.sepia;
        currentSettings.saturation = preset.saturation;
      }

      updateUI();
      saveAndDispatch();
    });
  });

  // Inspiration Seed Buttons
  seedButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const seedKey = btn.dataset.seed;
      const seed = INSPIRATION_SEEDS[seedKey];
      if (!seed) return;

      currentSettings.theme = 'custom';
      currentSettings.customBg = seed.bg;
      currentSettings.customSurface = seed.surface;
      currentSettings.customSurfaceElevated = seed.surfaceElevated;
      currentSettings.customText = seed.text;
      currentSettings.customTextMuted = seed.textMuted;
      currentSettings.customAccent = seed.accent;

      updateUI();
      saveAndDispatch();
    });
  });

  // Custom Studio Color Inputs
  function bindColorPicker(input, hexEl, settingsKey) {
    input.addEventListener('input', () => {
      const val = input.value;
      currentSettings[settingsKey] = val;
      hexEl.textContent = val;
      currentSettings.theme = 'custom';
      themeButtons.forEach((b) => b.classList.remove('active'));
      updateLivePreview();
      saveAndDispatch();
    });
  }

  bindColorPicker(customBgInput, customBgHex, 'customBg');
  bindColorPicker(customSurfaceInput, customSurfaceHex, 'customSurface');
  bindColorPicker(customElevatedInput, customElevatedHex, 'customSurfaceElevated');
  bindColorPicker(customTextInput, customTextHex, 'customText');
  bindColorPicker(customMutedInput, customMutedHex, 'customTextMuted');
  bindColorPicker(customAccentInput, customAccentHex, 'customAccent');

  // Atmosphere Effects
  atmosphereCards.forEach((card) => {
    card.addEventListener('click', () => {
      currentSettings.effect = card.dataset.effect;
      atmosphereCards.forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
      saveAndDispatch();
    });
  });

  effectIntensityInput.addEventListener('input', () => {
    currentSettings.effectIntensity = parseInt(effectIntensityInput.value, 10);
    effectIntensityVal.textContent = `${currentSettings.effectIntensity}%`;
    saveAndDispatch();
  });

  // Calibration Sliders
  brightnessInput.addEventListener('input', () => {
    currentSettings.brightness = parseInt(brightnessInput.value, 10);
    brightnessVal.textContent = `${currentSettings.brightness}%`;
    saveAndDispatch();
  });

  contrastInput.addEventListener('input', () => {
    currentSettings.contrast = parseInt(contrastInput.value, 10);
    contrastVal.textContent = `${currentSettings.contrast}%`;
    saveAndDispatch();
  });

  sepiaInput.addEventListener('input', () => {
    currentSettings.sepia = parseInt(sepiaInput.value, 10);
    sepiaVal.textContent = `${currentSettings.sepia}%`;
    saveAndDispatch();
  });

  saturationInput.addEventListener('input', () => {
    currentSettings.saturation = parseInt(saturationInput.value, 10);
    saturationVal.textContent = `${currentSettings.saturation}%`;
    saveAndDispatch();
  });

  mediaBrightnessInput.addEventListener('input', () => {
    currentSettings.mediaBrightness = parseInt(mediaBrightnessInput.value, 10);
    mediaBrightnessVal.textContent = `${currentSettings.mediaBrightness}%`;
    saveAndDispatch();
  });

  fontBoostInput.addEventListener('change', () => {
    currentSettings.fontBoost = fontBoostInput.checked;
    saveAndDispatch();
  });

  resetBtn.addEventListener('click', () => {
    const retainedDomains = currentSettings.excludedDomains || [];
    currentSettings = { ...DEFAULT_SETTINGS, excludedDomains: retainedDomains };
    updateUI();
    saveAndDispatch();
  });
});