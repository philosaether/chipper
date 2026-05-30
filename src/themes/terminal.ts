/**
 * Terminal theme — black surfaces, green everything, monospace font.
 *
 * Single hue with fallback — every domain renders in terminal green
 * regardless of its declared color role.
 */

import type { ChipperTheme } from './types';

export const terminalTheme: ChipperTheme = {
  name: 'terminal',

  surface: {
    bgPrimary: '#0a0a0a',
    bgSecondary: '#141414',
    bgTertiary: '#1e1e1e',
    bgElevated: '#1a1a1a',
    textPrimary: '#33ff33',
    textSecondary: '#22bb22',
    textMuted: '#117711',
    border: '#1a3a1a',
    borderSubtle: 'rgba(26, 58, 26, 0.4)',
  },

  accent: {
    base: '#33ff33',
    bright: '#66ff66',
    dim: '#22aa22',
    glow: '#0a2a0a',
  },

  semantic: {
    success: '#33ff33',
    warning: '#ffaa00',
    error: '#ff3333',
    info: '#33ff33',
  },

  structure: {
    radius: '4px',
    radiusLarge: '6px',
    font: "'SF Mono', 'Fira Code', 'Fira Mono', Menlo, monospace",
    fontMono: "'SF Mono', 'Fira Code', 'Fira Mono', Menlo, monospace",
    focusRing: '0 0 0 2px rgba(51, 255, 51, 0.3)',
    popupShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
    transition: '0.15s',
  },

  hues: {
    green: {
      name: 'green',
      text: '#33ff33',
      background: '#0a1a0a',
      hover: '#0f240f',
      glow: 'rgba(51, 255, 51, 0.25)',
    },
  },

  fallbackHue: 'green',
};
