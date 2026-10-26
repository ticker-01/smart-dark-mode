/**
 * Smart Dark Engine v0.2.0 - Universal CSSOM Compiler & Omni-Surface Harmonizer
 * Features real-time HSL color compilation, reactive video ambilight room glow,
 * custom 6-color studio, and universal SVG/button visibility preservation.
 */

(function () {
  'use strict';

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

  const THEMES = {
    charcoal: {
      bg: '#121418',
      surface: '#1a1d24',
      surfaceElevated: '#242832',
      border: 'rgba(255, 255, 255, 0.10)',
      text: '#e6edf3',
      textMuted: '#94a3b8',
      link: '#58a6ff',
      minBgL: 8,
      maxBgL: 18,
      minTextL: 80,
      maxTextL: 90
    },
    oled: {
      bg: '#000000',
      surface: '#0c0c0c',
      surfaceElevated: '#171717',
      border: 'rgba(255, 255, 255, 0.12)',
      text: '#f1f1f1',
      textMuted: '#a3a3a3',
      link: '#38bdf8',
      minBgL: 0,
      maxBgL: 10,
      minTextL: 85,
      maxTextL: 95
    },
    midnight: {
      bg: '#0b0f19',
      surface: '#111827',
      surfaceElevated: '#1a2234',
      border: 'rgba(148, 163, 184, 0.12)',
      text: '#e5edff',
      textMuted: '#94a3b8',
      link: '#60a5fa',
      minBgL: 7,
      maxBgL: 16,
      minTextL: 82,
      maxTextL: 92
    },
    warm: {
      bg: '#181512',
      surface: '#221e19',
      surfaceElevated: '#2c2620',
      border: 'rgba(217, 119, 6, 0.15)',
      text: '#ede4d8',
      textMuted: '#bfae9b',
      link: '#f59e0b',
      minBgL: 8,
      maxBgL: 17,
      minTextL: 80,
      maxTextL: 90
    },
    forest: {
      bg: '#101713',
      surface: '#18221c',
      surfaceElevated: '#202d25',
      border: 'rgba(16, 185, 129, 0.12)',
      text: '#e1ece5',
      textMuted: '#9cb5a5',
      link: '#34d399',
      minBgL: 7,
      maxBgL: 16,
      minTextL: 80,
      maxTextL: 90
    },
    cyberpunk: {
      bg: '#120e1f',
      surface: '#1a142e',
      surfaceElevated: '#241b3f',
      border: 'rgba(236, 72, 153, 0.20)',
      text: '#f5f3ff',
      textMuted: '#a78bfa',
      link: '#ec4899',
      minBgL: 7,
      maxBgL: 16,
      minTextL: 82,
      maxTextL: 94
    }
  };

  let currentSettings = { ...DEFAULT_SETTINGS };
  const currentHost = window.location.hostname.toLowerCase();
  const processedSheets = new Set();
  let mirrorStyleEl = null;
  let warmthOverlay = null;

  /* ==========================================================================
     1. Color Conversion & Perceptual HSL Math
     ========================================================================== */

  function parseColor(str) {
    if (!str || typeof str !== 'string') return null;
    str = str.trim().toLowerCase();

    if (str === 'transparent' || str === 'inherit' || str === 'initial' || str === 'currentcolor') {
      return null;
    }

    if (str.startsWith('#')) {
      let hex = str.slice(1);
      if (hex.length === 3) {
        hex = hex.split('').map((c) => c + c).join('');
      } else if (hex.length === 4) {
        hex = hex.slice(0, 3).split('').map((c) => c + c).join('');
      }
      if (hex.length >= 6) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
          return { r, g, b, a: 1 };
        }
      }
      return null;
    }

    const rgbMatch = str.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/);
    if (rgbMatch) {
      return {
        r: Math.round(parseFloat(rgbMatch[1])),
        g: Math.round(parseFloat(rgbMatch[2])),
        b: Math.round(parseFloat(rgbMatch[3])),
        a: rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1
      };
    }

    const spaceMatch = str.match(/^rgba?\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)$/);
    if (spaceMatch) {
      return {
        r: Math.round(parseFloat(spaceMatch[1])),
        g: Math.round(parseFloat(spaceMatch[2])),
        b: Math.round(parseFloat(spaceMatch[3])),
        a: spaceMatch[4] !== undefined ? parseFloat(spaceMatch[4]) : 1
      };
    }

    return null;
  }

  function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  function hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  function getActiveThemePalette() {
    if (currentSettings.theme === 'custom') {
      return {
        bg: currentSettings.customBg || '#121418',
        surface: currentSettings.customSurface || '#1a1d24',
        surfaceElevated: currentSettings.customSurfaceElevated || '#242832',
        border: 'rgba(255, 255, 255, 0.10)',
        text: currentSettings.customText || '#e6edf3',
        textMuted: currentSettings.customTextMuted || '#94a3b8',
        link: currentSettings.customAccent || '#58a6ff',
        minBgL: 8,
        maxBgL: 18,
        minTextL: 80,
        maxTextL: 90
      };
    }
    return THEMES[currentSettings.theme] || THEMES.charcoal;
  }

  function transformColorForDark(colorStr, type) {
    const parsed = parseColor(colorStr);
    if (!parsed) return null;
    if (parsed.a !== undefined && parsed.a <= 0.05) return 'transparent';

    const hsl = rgbToHsl(parsed.r, parsed.g, parsed.b);
    const theme = getActiveThemePalette();

    const brightFactor = (currentSettings.brightness || 92) / 92;
    const contrastFactor = (currentSettings.contrast || 92) / 92;
    const satMultiplier = (currentSettings.saturation || 100) / 100;

    if (type === 'background') {
      if (hsl.l > 40) {
        const ratio = (hsl.l - 40) / 60;
        const targetMinBgL = Math.max(0, Math.round(theme.minBgL * brightFactor));
        const targetMaxBgL = Math.max(targetMinBgL + 2, Math.round(theme.maxBgL * brightFactor));
        const newL = Math.round(targetMaxBgL - ratio * (targetMaxBgL - targetMinBgL));
        const newS = Math.min(100, Math.round(hsl.s * 0.75 * satMultiplier));
        let newH = hsl.h;
        if (currentSettings.sepia > 15) {
          newH = Math.round(hsl.h * 0.8 + 38 * 0.2);
        }
        const rgb = hslToRgb(newH, newS, newL);
        return parsed.a < 1 ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${parsed.a})` : `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      }
      return null;
    }

    if (type === 'text') {
      if (hsl.l < 55) {
        const ratio = (55 - hsl.l) / 55;
        const targetMinTextL = Math.min(100, Math.round(theme.minTextL * brightFactor * contrastFactor));
        const targetMaxTextL = Math.min(100, Math.round(theme.maxTextL * brightFactor * contrastFactor));
        const newL = Math.round(targetMinTextL + ratio * (targetMaxTextL - targetMinTextL));
        const newS = Math.min(100, Math.round(hsl.s * 0.85 * satMultiplier));
        let newH = hsl.h;
        if (currentSettings.sepia > 15) {
          newH = Math.round(hsl.h * 0.8 + 38 * 0.2);
        }
        const rgb = hslToRgb(newH, newS, newL);
        return parsed.a < 1 ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${parsed.a})` : `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      }
      return null;
    }

    if (type === 'border') {
      if (hsl.l > 35) {
        const rgb = hslToRgb(hsl.h, Math.round(hsl.s * 0.7 * satMultiplier), 24);
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`;
      }
      return null;
    }

    return null;
  }

  function transformGradient(gradientStr) {
    if (!gradientStr || !gradientStr.includes('gradient')) return null;

    const colorRegex = /(#[0-9a-f]{3,8}|rgba?\([^)]+\))/gi;
    let modified = false;

    const newGradient = gradientStr.replace(colorRegex, (match) => {
      const transformed = transformColorForDark(match, 'background');
      if (transformed) {
        modified = true;
        return transformed;
      }
      return match;
    });

    return modified ? newGradient : null;
  }

  /* ==========================================================================
     2. Real-Time CSSOM Interception & Mirroring
     ========================================================================== */

  function getOrCreateMirrorSheet() {
    if (!mirrorStyleEl || !mirrorStyleEl.parentNode) {
      mirrorStyleEl = document.getElementById('smart-dark-compiled-rules');
      if (!mirrorStyleEl) {
        mirrorStyleEl = document.createElement('style');
        mirrorStyleEl.id = 'smart-dark-compiled-rules';
        (document.head || document.documentElement).appendChild(mirrorStyleEl);
      }
    }
    return mirrorStyleEl;
  }

  function processRule(rule, compiledRules) {
    if (!rule || !rule.style || !rule.selectorText) return;

    const sel = rule.selectorText;
    if (sel.includes('smart-dark') || sel.includes('[data-sdm')) return;

    let overrides = [];

    // Background color
    const bg = rule.style.backgroundColor;
    if (bg) {
      const darkBg = transformColorForDark(bg, 'background');
      if (darkBg) overrides.push(`background-color: ${darkBg} !important;`);
    }

    // Background gradient
    const bgImg = rule.style.backgroundImage;
    if (bgImg && bgImg.includes('gradient')) {
      const darkGrad = transformGradient(bgImg);
      if (darkGrad) overrides.push(`background-image: ${darkGrad} !important;`);
    }

    // Text color
    const color = rule.style.color;
    if (color) {
      const darkColor = transformColorForDark(color, 'text');
      if (darkColor) overrides.push(`color: ${darkColor} !important;`);
    }

    // Border colors
    const border = rule.style.borderColor;
    if (border) {
      const darkBorder = transformColorForDark(border, 'border');
      if (darkBorder) overrides.push(`border-color: ${darkBorder} !important;`);
    }

    if (overrides.length > 0) {
      compiledRules.push(`${sel} { ${overrides.join(' ')} }`);
    }
  }

  function compileStyleSheet(sheet, compiledRules) {
    if (!sheet) return;

    try {
      const rules = sheet.cssRules || sheet.rules;
      if (!rules) return;

      for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];
        if (rule.type === CSSRule.STYLE_RULE) {
          processRule(rule, compiledRules);
        } else if (rule.type === CSSRule.MEDIA_RULE) {
          const mediaRules = [];
          for (let j = 0; j < rule.cssRules.length; j++) {
            processRule(rule.cssRules[j], mediaRules);
          }
          if (mediaRules.length > 0) {
            compiledRules.push(`@media ${rule.conditionText || rule.media.mediaText} { ${mediaRules.join('\n')} }`);
          }
        } else if (rule.type === CSSRule.SUPPORTS_RULE) {
          const supportsRules = [];
          for (let k = 0; k < rule.cssRules.length; k++) {
            processRule(rule.cssRules[k], supportsRules);
          }
          if (supportsRules.length > 0) {
            compiledRules.push(`@supports ${rule.conditionText} { ${supportsRules.join('\n')} }`);
          }
        }
      }
    } catch (e) {
      // Cross-origin protected stylesheet: request background fetch
      if (sheet.href && !processedSheets.has(sheet.href)) {
        processedSheets.add(sheet.href);
        fetchAndRecompileCrossOriginCSS(sheet.href);
      }
    }
  }

  function fetchAndRecompileCrossOriginCSS(url) {
    if (!chrome.runtime || !chrome.runtime.sendMessage) return;

    chrome.runtime.sendMessage({
      action: 'FETCH_CROSS_ORIGIN_CSS',
      url: url
    }, (response) => {
      if (chrome.runtime.lastError || !response || !response.success || !response.css) {
        return;
      }

      try {
        const tempStyle = document.createElement('style');
        tempStyle.textContent = response.css;
        document.documentElement.appendChild(tempStyle);

        const tempSheet = tempStyle.sheet;
        const compiledRules = [];
        compileStyleSheet(tempSheet, compiledRules);

        tempStyle.remove();

        if (compiledRules.length > 0) {
          const mirror = getOrCreateMirrorSheet();
          mirror.textContent += '\n' + compiledRules.join('\n');
        }
      } catch (err) {
        // Fallback silently
      }
    });
  }

  function compileAllStylesheets() {
    const sheets = document.styleSheets;
    const compiledRules = [];

    for (let i = 0; i < sheets.length; i++) {
      const sheet = sheets[i];
      if (sheet.ownerNode && (sheet.ownerNode.id === 'smart-dark-compiled-rules' || sheet.ownerNode.id === 'smart-dark-engine-style')) {
        continue;
      }
      compileStyleSheet(sheet, compiledRules);
    }

    if (compiledRules.length > 0) {
      const mirror = getOrCreateMirrorSheet();
      mirror.textContent = compiledRules.join('\n');
    }
  }

  /* ==========================================================================
     3. Omni-Surface Harmonizer: Neutralize Stubborn Dynamic Containers
     ========================================================================== */

  function scanAndNeutralizeLightSurfaces() {
    const candidateNodes = document.querySelectorAll(
      'header, nav, [role="tablist"], [role="tab"], [data-test-id*="tab"], [class*="tab"], [class*="Tab"], [class*="navbar"], [class*="header"], [class*="Header"], [class*="strip"], [class*="container"], [class*="wrapper"]'
    );

    const theme = getActiveThemePalette();

    for (let i = 0; i < candidateNodes.length; i++) {
      const el = candidateNodes[i];
      if (el.getAttribute('data-sdm-neutralized') === 'true') continue;

      const style = window.getComputedStyle(el);
      const bg = parseColor(style.backgroundColor);

      if (bg && bg.a > 0.1) {
        const hsl = rgbToHsl(bg.r, bg.g, bg.b);
        if (hsl.l > 55) {
          el.setAttribute('data-sdm-neutralized', 'true');
          el.style.setProperty('background-color', theme.bg, 'important');
          el.style.setProperty('color', theme.text, 'important');
          el.style.setProperty('border-color', theme.border, 'important');
        }
      }
    }
  }

  function processInlineStyles() {
    const styledElements = document.querySelectorAll('[style*="background"], [style*="color"]');
    for (let i = 0; i < styledElements.length; i++) {
      const el = styledElements[i];
      if (el.id === 'smart-dark-compiled-rules' || el.id === 'sdm-warmth-overlay') continue;

      const inlineBg = el.style.backgroundColor;
      if (inlineBg) {
        const t = transformColorForDark(inlineBg, 'background');
        if (t) el.style.setProperty('background-color', t, 'important');
      }

      const inlineColor = el.style.color;
      if (inlineColor) {
        const t = transformColorForDark(inlineColor, 'text');
        if (t) el.style.setProperty('color', t, 'important');
      }

      const inlineBorder = el.style.borderColor;
      if (inlineBorder) {
        const t = transformColorForDark(inlineBorder, 'border');
        if (t) el.style.setProperty('border-color', t, 'important');
      }
    }
  }

  /* ==========================================================================
     4. Reactive Video Ambilight Engine
     Extracts real-time color tones from HTML5 videos and dynamically casts
     smooth background room lighting synced with playing scenes.
     ========================================================================== */

  let ambilightRunning = false;
  let ambilightRafId = null;
  let ambilightCanvas = null;
  let ambilightCtx = null;
  let lastAmbilightSample = 0;
  let curR1 = 88, curG1 = 166, curB1 = 255;
  let curR2 = 163, curG2 = 113, curB2 = 247;
  let activeVideo = null;

  function findPlayingVideo() {
    const videos = document.querySelectorAll('video');
    for (let i = 0; i < videos.length; i++) {
      const v = videos[i];
      if (!v.paused && !v.ended && v.readyState >= 2 && v.videoWidth > 0 && v.videoHeight > 0) {
        return v;
      }
    }
    for (let i = 0; i < videos.length; i++) {
      const v = videos[i];
      if (v.readyState >= 1 && v.videoWidth > 0) {
        return v;
      }
    }
    return null;
  }

  function boostAmbilightColor(r, g, b) {
    const max = Math.max(r, g, b);
    if (max < 16) return { r: 18, g: 20, b: 24 };

    const avg = (r + g + b) / 3;
    const factor = 1.35;
    const newR = Math.min(255, Math.max(0, Math.round(avg + (r - avg) * factor)));
    const newG = Math.min(255, Math.max(0, Math.round(avg + (g - avg) * factor)));
    const newB = Math.min(255, Math.max(0, Math.round(avg + (b - avg) * factor)));
    return { r: newR, g: newG, b: newB };
  }

  function setAmbilightCSS(r1, g1, b1, r2, g2, b2) {
    const root = document.documentElement;
    if (!root) return;
    root.style.setProperty('--sdm-ambilight-color1', `rgb(${r1}, ${g1}, ${b1})`);
    root.style.setProperty('--sdm-ambilight-color2', `rgb(${r2}, ${g2}, ${b2})`);
    root.style.setProperty('--sdm-ambilight-glow', `rgba(${r1}, ${g1}, ${b1}, 0.35)`);
  }

  function fadeToRestingAmbilight() {
    const theme = getActiveThemePalette();
    const pLink = parseColor(theme.link) || { r: 88, g: 166, b: 255 };
    const pElev = parseColor(theme.surfaceElevated) || { r: 36, g: 40, b: 50 };

    const alpha = 0.08;
    curR1 = Math.round(curR1 * (1 - alpha) + pLink.r * alpha);
    curG1 = Math.round(curG1 * (1 - alpha) + pLink.g * alpha);
    curB1 = Math.round(curB1 * (1 - alpha) + pLink.b * alpha);

    curR2 = Math.round(curR2 * (1 - alpha) + pElev.r * alpha);
    curG2 = Math.round(curG2 * (1 - alpha) + pElev.g * alpha);
    curB2 = Math.round(curB2 * (1 - alpha) + pElev.b * alpha);

    setAmbilightCSS(curR1, curG1, curB1, curR2, curG2, curB2);
  }

  function sampleAmbilightTick() {
    if (!ambilightRunning) return;

    const video = (activeVideo && !activeVideo.paused && !activeVideo.ended && activeVideo.readyState >= 2)
      ? activeVideo
      : findPlayingVideo();

    if (!video || video.paused || video.ended || video.readyState < 2) {
      fadeToRestingAmbilight();
      return;
    }

    activeVideo = video;

    if (!ambilightCanvas) {
      ambilightCanvas = document.createElement('canvas');
      ambilightCanvas.width = 16;
      ambilightCanvas.height = 9;
      ambilightCtx = ambilightCanvas.getContext('2d', { willReadFrequently: true });
    }

    try {
      ambilightCtx.drawImage(video, 0, 0, 16, 9);
      const data = ambilightCtx.getImageData(0, 0, 16, 9).data;

      // Sample top region (rows 0-2: 48 pixels)
      let tR = 0, tG = 0, tB = 0, tCount = 0;
      for (let i = 0; i < 16 * 3 * 4; i += 4) {
        tR += data[i];
        tG += data[i + 1];
        tB += data[i + 2];
        tCount++;
      }
      tR = Math.round(tR / tCount);
      tG = Math.round(tG / tCount);
      tB = Math.round(tB / tCount);

      // Sample bottom region (rows 5-8: 64 pixels)
      let bR = 0, bG = 0, bB = 0, bCount = 0;
      for (let i = 16 * 5 * 4; i < 16 * 9 * 4; i += 4) {
        bR += data[i];
        bG += data[i + 1];
        bB += data[i + 2];
        bCount++;
      }
      bR = Math.round(bR / bCount);
      bG = Math.round(bG / bCount);
      bB = Math.round(bB / bCount);

      const target1 = boostAmbilightColor(tR, tG, tB);
      const target2 = boostAmbilightColor(bR, bG, bB);

      const smooth = 0.28;
      curR1 = Math.round(curR1 * (1 - smooth) + target1.r * smooth);
      curG1 = Math.round(curG1 * (1 - smooth) + target1.g * smooth);
      curB1 = Math.round(curB1 * (1 - smooth) + target1.b * smooth);

      curR2 = Math.round(curR2 * (1 - smooth) + target2.r * smooth);
      curG2 = Math.round(curG2 * (1 - smooth) + target2.g * smooth);
      curB2 = Math.round(curB2 * (1 - smooth) + target2.b * smooth);

      setAmbilightCSS(curR1, curG1, curB1, curR2, curG2, curB2);
    } catch (e) {
      fadeToRestingAmbilight();
    }
  }

  let ambilightTimer = null;

  function startAmbilight() {
    if (ambilightRunning) return;
    ambilightRunning = true;
    bindVideoListeners();
    // Set immediate initial colors
    setAmbilightCSS(curR1, curG1, curB1, curR2, curG2, curB2);
    sampleAmbilightTick();
    if (ambilightTimer) clearInterval(ambilightTimer);
    ambilightTimer = setInterval(sampleAmbilightTick, 50);
  }

  function stopAmbilight() {
    if (!ambilightRunning) return;
    ambilightRunning = false;
    if (ambilightTimer) {
      clearInterval(ambilightTimer);
      ambilightTimer = null;
    }
    activeVideo = null;
  }

  function bindVideoListeners() {
    const videos = document.querySelectorAll('video');
    videos.forEach((v) => {
      if (!v._sdmAmbilightBound) {
        v._sdmAmbilightBound = true;
        v.addEventListener('play', () => { activeVideo = v; });
        v.addEventListener('playing', () => { activeVideo = v; });
      }
    });
  }

  /* ==========================================================================
     5. Lifecycle & Runtime State
     ========================================================================== */

  function isDomainExcluded(host, list) {
    if (!list || !list.length) return false;
    return list.some((d) => {
      const trimmed = d.trim().toLowerCase();
      return host === trimmed || host.endsWith('.' + trimmed);
    });
  }

  function ensureWarmthOverlay() {
    if (!warmthOverlay || !warmthOverlay.parentNode) {
      warmthOverlay = document.getElementById('sdm-warmth-overlay');
      if (!warmthOverlay) {
        warmthOverlay = document.createElement('div');
        warmthOverlay.id = 'sdm-warmth-overlay';
        (document.documentElement || document.body).appendChild(warmthOverlay);
      }
    }
    return warmthOverlay;
  }

  function applyBaseThemeVariables(settings) {
    const root = document.documentElement;
    if (!root) return;

    const theme = getActiveThemePalette();

    root.style.setProperty('--sdm-bg', theme.bg);
    root.style.setProperty('--sdm-surface', theme.surface);
    root.style.setProperty('--sdm-surface-elevated', theme.surfaceElevated);
    root.style.setProperty('--sdm-border', theme.border);
    root.style.setProperty('--sdm-text', theme.text);
    root.style.setProperty('--sdm-text-muted', theme.textMuted);
    root.style.setProperty('--sdm-link', theme.link);
    root.style.setProperty('--sdm-media-brightness', `${settings.mediaBrightness || 92}%`);

    const effect = settings.effect || 'matte';
    root.setAttribute('data-sdm-effect', effect);

    const effectIntensity = (settings.effectIntensity || 50) / 100;
    root.style.setProperty('--sdm-effect-opacity', effectIntensity.toFixed(2));

    if (effect === 'ambilight') {
      startAmbilight();
    } else {
      stopAmbilight();
    }

    const sepiaVal = settings.sepia || 0;
    const warmthAlpha = (sepiaVal / 50) * 0.18;
    root.style.setProperty('--sdm-warmth-opacity', warmthAlpha.toFixed(3));
    if (sepiaVal > 0) {
      ensureWarmthOverlay();
    }

    if (settings.fontBoost) {
      root.setAttribute('data-sdm-font-boost', 'true');
    } else {
      root.removeAttribute('data-sdm-font-boost');
    }
  }

  function activateEngine() {
    const root = document.documentElement;
    if (!root) return;

    root.setAttribute('data-sdm-active', 'true');
    applyBaseThemeVariables(currentSettings);

    compileAllStylesheets();
    processInlineStyles();
    scanAndNeutralizeLightSurfaces();

    setupObserver();
  }

  function deactivateEngine() {
    const root = document.documentElement;
    if (!root) return;

    root.removeAttribute('data-sdm-active');
    root.removeAttribute('data-sdm-effect');
    root.removeAttribute('data-sdm-font-boost');

    stopAmbilight();

    if (mirrorStyleEl) {
      mirrorStyleEl.textContent = '';
    }
    if (warmthOverlay) {
      warmthOverlay.remove();
      warmthOverlay = null;
    }
    processedSheets.clear();
  }

  let domObserver = null;
  let recompileTimer = null;

  function setupObserver() {
    if (domObserver || !window.MutationObserver) return;

    domObserver = new MutationObserver((mutations) => {
      let hasStyleChanges = false;
      let hasDomAdditions = false;

      for (let i = 0; i < mutations.length; i++) {
        const mut = mutations[i];
        if (mut.addedNodes.length > 0) {
          hasDomAdditions = true;
          for (let j = 0; j < mut.addedNodes.length; j++) {
            const node = mut.addedNodes[j];
            if (node.tagName === 'STYLE' || node.tagName === 'LINK') {
              hasStyleChanges = true;
              if (node.tagName === 'LINK') {
                node.addEventListener('load', () => {
                  compileAllStylesheets();
                });
              }
              break;
            }
          }
        }
      }

      if (hasStyleChanges) {
        clearTimeout(recompileTimer);
        recompileTimer = setTimeout(() => {
          compileAllStylesheets();
          processInlineStyles();
        }, 100);
      } else if (hasDomAdditions) {
        clearTimeout(recompileTimer);
        recompileTimer = setTimeout(() => {
          processInlineStyles();
          scanAndNeutralizeLightSurfaces();
          if (currentSettings.effect === 'ambilight') {
            bindVideoListeners();
          }
        }, 150);
      }
    });

    domObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  function loadSettings() {
    if (!chrome.storage || !chrome.storage.local) {
      activateEngine();
      return;
    }

    chrome.storage.local.get(DEFAULT_SETTINGS, (stored) => {
      currentSettings = { ...DEFAULT_SETTINGS, ...stored };
      const isExcluded = isDomainExcluded(currentHost, currentSettings.excludedDomains);

      if (currentSettings.enabled && !isExcluded) {
        activateEngine();
      } else {
        deactivateEngine();
      }
    });
  }

  // Handle messages from popup
  if (chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'UPDATE_SETTINGS') {
        currentSettings = { ...currentSettings, ...request.settings };
        const isExcluded = isDomainExcluded(currentHost, currentSettings.excludedDomains);

        if (currentSettings.enabled && !isExcluded) {
          if (mirrorStyleEl) mirrorStyleEl.textContent = '';
          processedSheets.clear();
          activateEngine();
        } else {
          deactivateEngine();
        }
        sendResponse({ success: true });
      } else if (request.action === 'GET_TAB_STATUS') {
        const isExcluded = isDomainExcluded(currentHost, currentSettings.excludedDomains);
        sendResponse({
          host: currentHost,
          isExcluded: isExcluded,
          isActive: currentSettings.enabled && !isExcluded,
          settings: currentSettings
        });
      }
      return true;
    });
  }

  // Pre-load base style immediately on document_start
  const isExcludedEarly = isDomainExcluded(currentHost, currentSettings.excludedDomains);
  if (!isExcludedEarly) {
    document.documentElement.setAttribute('data-sdm-active', 'true');
    applyBaseThemeVariables(currentSettings);
    if (!mirrorStyleEl) {
      mirrorStyleEl = document.createElement('style');
      mirrorStyleEl.id = 'smart-dark-compiled-rules';
      (document.head || document.documentElement).appendChild(mirrorStyleEl);
    }
    compileAllStylesheets();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSettings);
  } else {
    loadSettings();
  }
})();