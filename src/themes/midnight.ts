/**
 * Midnight theme — cool dark surfaces, blue accents.
 *
 * Ten hue roles matching praxis's vocabulary, rendered as desaturated
 * cool variants on dark pastel backgrounds. Each hue includes a glow
 * color for the expanded-chip state — neutral shadows disappear on
 * dark backgrounds, so chips glow in their own hue.
 */

import type { ChipperTheme } from './types';

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
    gold:   { name: 'gold',   text: '#d4af37', background: '#2e2810', hover: '#3a3218', glow: 'rgba(212, 175, 55, 0.2)' },
    plum:   { name: 'plum',   text: '#b88ad4', background: '#2a1e3a', hover: '#332644', glow: 'rgba(184, 138, 212, 0.2)' },
    copper: { name: 'copper', text: '#d4a87a', background: '#2e2418', hover: '#3a2e20', glow: 'rgba(212, 168, 122, 0.2)' },
    sage:   { name: 'sage',   text: '#7ac47a', background: '#1a2e1a', hover: '#223822', glow: 'rgba(122, 196, 122, 0.2)' },
    slate:  { name: 'slate',  text: '#7aaad4', background: '#1a2240', hover: '#222a4a', glow: 'rgba(122, 170, 212, 0.2)' },
    stone:  { name: 'stone',  text: '#b0a898', background: '#2a2822', hover: '#33302a', glow: 'rgba(176, 168, 152, 0.2)' },
    teal:   { name: 'teal',   text: '#6ac4be', background: '#1a2e2c', hover: '#223836', glow: 'rgba(106, 196, 190, 0.2)' },
    rose:   { name: 'rose',   text: '#d48a96', background: '#2e1a1e', hover: '#382228', glow: 'rgba(212, 138, 150, 0.2)' },
    umber:  { name: 'umber',  text: '#c4b060', background: '#2a2818', hover: '#333020', glow: 'rgba(196, 176, 96, 0.2)' },
    indigo: { name: 'indigo', text: '#8a9ad4', background: '#1e2240', hover: '#262c4a', glow: 'rgba(138, 154, 212, 0.2)' },
  },
};
