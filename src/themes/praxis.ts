/**
 * Praxis theme — The Alchemist's Folio.
 *
 * Warm parchment surfaces, gold accents, ten classification hues.
 * This is the default theme — SCSS provides these values via the cascade.
 * The JS object enables runtime switching back to praxis after applying
 * another theme, and serves as the reference implementation for theme authors.
 */

import type { ChipperTheme } from './types';
import { createHue } from './create-hue';

export const praxisTheme: ChipperTheme = {
  name: 'praxis',

  surface: {
    bgPrimary: '#fbf9f5',
    bgSecondary: '#f5f3ef',
    bgTertiary: '#ebe8e2',
    bgElevated: '#ffffff',
    textPrimary: '#1b1c1a',
    textSecondary: '#4a4a48',
    textMuted: '#726f6c',
    border: '#d0c5af',
    borderSubtle: 'rgba(208, 197, 175, 0.4)',
  },

  accent: {
    base: '#735c00',
    bright: '#d4af37',
    dim: '#5a4700',
    glow: '#f7e1a6',
  },

  semantic: {
    success: '#2e7d32',
    warning: '#f57c00',
    error: '#8c0d27',
    info: '#1565c0',
  },

  structure: {
    radius: '4px',
    radiusLarge: '6px',
    font: 'inherit',
    fontMono: "'SF Mono', 'Fira Code', 'Fira Mono', Menlo, monospace",
    focusRing: '0 0 0 2px rgba(115, 92, 0, 0.3)',
    popupShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    transition: '0.15s',
  },

  hues: {
    gold: createHue('gold', '#8a5a00', '#ffecd0'),
    plum: createHue('plum', '#5c3d7a', '#e8daef'),
    copper: createHue('copper', '#8f5a28', '#fde8d4'),
    sage: createHue('sage', '#2e5a30', '#d4edda'),
    slate: createHue('slate', '#2a5082', '#d6e5f5'),
    stone: createHue('stone', '#6b5e4f', '#e8e4dc'),
    teal: createHue('teal', '#246e67', '#d6f0ee'),
    rose: createHue('rose', '#994d5a', '#f5dfe0'),
    umber: createHue('umber', '#736130', '#f5ecd6'),
    indigo: createHue('indigo', '#3d4a8c', '#dfe3f5'),
  },
};
