/**
 * Midnight theme — cool dark surfaces, blue accents.
 *
 * Ten hue roles matching praxis's vocabulary, rendered as desaturated
 * cool variants on dark pastel backgrounds. Each hue includes a glow
 * color for the expanded-chip state — neutral shadows disappear on
 * dark backgrounds, so chips glow in their own hue.
 */

import type { ChipperTheme } from './types';
import type { Hue } from './types';

/** Create a midnight hue with explicit values and hue-tinted glow. */
function midnightHue(
  name: string,
  text: string,
  background: string,
  hover: string,
  glow: string,
): Hue {
  return { name, text, background, hover, glow };
}

export const midnightTheme: ChipperTheme = {
  name: 'midnight',

  surface: {
    bgPrimary: '#1a1b2e',
    bgSecondary: '#232440',
    bgTertiary: '#2d2f50',
    bgElevated: '#2a2c48',
    textPrimary: '#e0e0ef',
    textSecondary: '#a0a0c0',
    textMuted: '#6a6a8a',
    border: '#3a3c5e',
    borderSubtle: 'rgba(58, 60, 94, 0.4)',
  },

  accent: {
    base: '#7b9fd4',
    bright: '#a8c4e8',
    dim: '#5a7fb0',
    glow: '#3a4a6e',
  },

  semantic: {
    success: '#66bb6a',
    warning: '#ffa726',
    error: '#ef5350',
    info: '#42a5f5',
  },

  structure: {
    radius: '4px',
    radiusLarge: '6px',
    font: 'inherit',
    fontMono: "'SF Mono', 'Fira Code', 'Fira Mono', Menlo, monospace",
    focusRing: '0 0 0 2px rgba(123, 159, 212, 0.3)',
    popupShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    transition: '0.15s',
  },

  hues: {
    gold: midnightHue('gold', '#d4af37', '#2e2810', '#3a3218', 'rgba(212, 175, 55, 0.2)'),
    plum: midnightHue('plum', '#b88ad4', '#2a1e3a', '#332644', 'rgba(184, 138, 212, 0.2)'),
    copper: midnightHue('copper', '#d4a87a', '#2e2418', '#3a2e20', 'rgba(212, 168, 122, 0.2)'),
    sage: midnightHue('sage', '#7ac47a', '#1a2e1a', '#223822', 'rgba(122, 196, 122, 0.2)'),
    slate: midnightHue('slate', '#7aaad4', '#1a2240', '#222a4a', 'rgba(122, 170, 212, 0.2)'),
    stone: midnightHue('stone', '#b0a898', '#2a2822', '#33302a', 'rgba(176, 168, 152, 0.2)'),
    teal: midnightHue('teal', '#6ac4be', '#1a2e2c', '#223836', 'rgba(106, 196, 190, 0.2)'),
    rose: midnightHue('rose', '#d48a96', '#2e1a1e', '#382228', 'rgba(212, 138, 150, 0.2)'),
    umber: midnightHue('umber', '#c4b060', '#2a2818', '#333020', 'rgba(196, 176, 96, 0.2)'),
    indigo: midnightHue('indigo', '#8a9ad4', '#1e2240', '#262c4a', 'rgba(138, 154, 212, 0.2)'),
  },
};
