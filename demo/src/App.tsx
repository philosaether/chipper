import { useState } from 'react';
import {
  Chipper,
  sentence,
  builder,
  extendPalette,
  keywordDomain,
  numberDomain,
  dateDomain,
  textDomain,
  keywordOrExpressionDomain,
  numericExpression,
  multiSelectDomain,
  alternativeCoordinateDomain,
} from 'chipper';
import type { SentenceState } from 'chipper';
import 'chipper/styles.css';
import './demo.css';

//
//  CHIPPER CONFIG
//

const praxisPalette = extendPalette({
  chips: {
    cadenceMeasure: keywordOrExpressionDomain({
      color: 'copper',
      keywords: [
        { value: 'daily', label: 'day' },
        { value: 'weekly', label: 'week' },
        { value: 'monthly', label: 'month' },
        { value: 'weekday' },
        { value: 'weekend', label: 'weekend day' },
      ],
      expression: numericExpression({
        min: 1,
        max: 365,
        trigger: { label: 'custom interval', default: '2' },
      }),
      default: 'weekly',
    }),
    cadenceUnit: keywordDomain({
      color: 'copper',
      keywords: [
        { value: 'day', label: 'days' },
        { value: 'week', label: 'weeks' },
        { value: 'month', label: 'months' },
        { value: 'quarter', label: 'quarters' },
        { value: 'year', label: 'years' },
      ],
    }),
    cadenceOffset: keywordOrExpressionDomain({
      color: 'copper',
      keywords: [
        { value: '0', label: 'immediately' },
        { value: '1', label: (ctx) => `next ${ctx.cadenceUnit ?? 'month'}` },
      ],
      expression: numericExpression({
        min: 0,
        max: 52,
        prefix: 'in',
        suffix: (ctx) => String(ctx.cadenceUnit ?? 'month') + 's',
      }),
    }),
    dayOfWeek: multiSelectDomain({
      color: 'sage',
      options: [
        { label: 'Mon', value: 'mon' },
        { label: 'Tue', value: 'tue' },
        { label: 'Wed', value: 'wed' },
        { label: 'Thu', value: 'thu' },
        { label: 'Fri', value: 'fri' },
        { label: 'Sat', value: 'sat' },
        { label: 'Sun', value: 'sun' },
      ],
      keywords: [
        { label: 'weekdays', value: ['mon', 'tue', 'wed', 'thu', 'fri'] }
      ],
      placeholder: 'one or more days',
      countLabel: 'days',
    }),
    dayOfMonth: alternativeCoordinateDomain({
      color: 'sage',
      modes: [
        {
          id: 'date',
          label: 'Date',
          slots: [{
            prefix: 'the',
            keywords: [
              { label: 'first', value: '1' },
              { label: '15th', value: '15' },
              { label: 'last', value: 'last', displayLabel: 'last day' },
            ],
          }],
          compose: (day) => day,
          decompose: (v) => [v],
          display: (v) => {
            if (v === 'last') return 'the last day';
            const s = ['th', 'st', 'nd', 'rd'];
            const n = Number(v);
            const suffix = n > 3 && n < 21 ? 'th' : (s[n % 10] ?? 'th');
            return `the ${n}${suffix}`;
          },
        },
        {
          id: 'weekday',
          label: 'Weekday',
          slots: [
            {
              prefix: 'the',
              keywords: [
                { label: 'first', value: 'first' },
                { label: 'second', value: 'second' },
                { label: 'third', value: 'third' },
                { label: 'fourth', value: 'fourth' },
                { label: 'last', value: 'last' },
              ],
            },
            {
              keywords: [
                { label: 'Mon', value: 'monday' },
                { label: 'Tue', value: 'tuesday' },
                { label: 'Wed', value: 'wednesday' },
                { label: 'Thu', value: 'thursday' },
                { label: 'Fri', value: 'friday' },
                { label: 'Sat', value: 'saturday' },
                { label: 'Sun', value: 'sunday' },
              ],
            },
          ],
          compose: (ordinal, day) => `${ordinal} ${day}`,
          decompose: (v) => {
            const parts = v.split(' ');
            return parts.length === 2 ? parts : [undefined, undefined];
          },
          display: (v) => {
            const [ordinal, day] = v.split(' ');
            if (!ordinal || !day) return v;
            return `the ${ordinal} ${day.charAt(0).toUpperCase() + day.slice(1)}`;
          },
        },
      ],
      placeholder: 'a day',
    }),
    monthOfQuarter: keywordDomain({
      color: 'sage',
      keywords: [
        { label: 'first', value: '1' },
        { label: 'second', value: '2' },
        { label: 'last', value: '3' },
      ],
    }),
    monthOfYear: keywordDomain({
      color: 'sage',
      keywords: [
        { label: 'Jan', value: 'jan' },
        { label: 'Feb', value: 'feb' },
        { label: 'Mar', value: 'mar' },
        { label: 'Apr', value: 'apr' },
        { label: 'May', value: 'may' },
        { label: 'Jun', value: 'jun' },
        { label: 'Jul', value: 'jul' },
        { label: 'Aug', value: 'aug' },
        { label: 'Sep', value: 'sep' },
        { label: 'Oct', value: 'oct' },
        { label: 'Nov', value: 'nov' },
        { label: 'Dec', value: 'dec' },
      ],
    }),
    timeOfDay: numberDomain({
      color: 'slate',
      keywords: [
        { value: '6', label: 'dawn' },
        { value: '12', label: 'noon' },
        { value: '18', label: 'dusk' },
        { value: '24', label: 'midnight' },
      ],
      min: 0,
      max: 24,
      suffix: ':00',
      placeholder: 'a specific time of day',
    }),
    taskName: textDomain({
      color: 'rose',
      placeholder: 'New Task',
    }),
  },
});

//
//  THEME TOGGLE
//

const themeTokens: Record<string, Record<string, string>> = {
  praxis: {
    // Default — no overrides needed, SCSS provides these
  },
  midnight: {
    '--chipper-bg-primary': '#1a1b2e',
    '--chipper-bg-secondary': '#232440',
    '--chipper-bg-tertiary': '#2d2f50',
    '--chipper-bg-elevated': '#2a2c48',
    '--chipper-text-primary': '#e0e0ef',
    '--chipper-text-secondary': '#a0a0c0',
    '--chipper-text-muted': '#6a6a8a',
    '--chipper-border': '#3a3c5e',
    '--chipper-border-subtle': 'rgba(58, 60, 94, 0.4)',
    '--chipper-accent': '#7b9fd4',
    '--chipper-accent-bright': '#a8c4e8',
    '--chipper-accent-dim': '#5a7fb0',
    '--chipper-accent-glow': '#3a4a6e',
    '--chipper-focus-ring': '0 0 0 2px rgba(123, 159, 212, 0.3)',
    '--chipper-popup-shadow': '0 4px 12px rgba(0, 0, 0, 0.3)',
    // Chip colors — cool desaturated hues on dark pastels
    '--chipper-color-copper-text': '#d4a87a',
    '--chipper-color-copper-bg': '#2e2418',
    '--chipper-color-copper-hover': '#3a2e20',
    '--chipper-color-sage-text': '#7ac47a',
    '--chipper-color-sage-bg': '#1a2e1a',
    '--chipper-color-sage-hover': '#223822',
    '--chipper-color-slate-text': '#7aaad4',
    '--chipper-color-slate-bg': '#1a2240',
    '--chipper-color-slate-hover': '#222a4a',
    '--chipper-color-stone-text': '#b0a898',
    '--chipper-color-stone-bg': '#2a2822',
    '--chipper-color-stone-hover': '#33302a',
    '--chipper-color-teal-text': '#6ac4be',
    '--chipper-color-teal-bg': '#1a2e2c',
    '--chipper-color-teal-hover': '#223836',
    '--chipper-color-rose-text': '#d48a96',
    '--chipper-color-rose-bg': '#2e1a1e',
    '--chipper-color-rose-hover': '#382228',
  },
  terminal: {
    '--chipper-font': "'SF Mono', 'Fira Code', 'Fira Mono', Menlo, monospace",
    '--demo-font': "'SF Mono', 'Fira Code', 'Fira Mono', Menlo, monospace",
    '--chipper-bg-primary': '#0a0a0a',
    '--chipper-bg-secondary': '#141414',
    '--chipper-bg-tertiary': '#1e1e1e',
    '--chipper-bg-elevated': '#1a1a1a',
    '--chipper-text-primary': '#33ff33',
    '--chipper-text-secondary': '#22bb22',
    '--chipper-text-muted': '#117711',
    '--chipper-border': '#1a3a1a',
    '--chipper-border-subtle': 'rgba(26, 58, 26, 0.4)',
    '--chipper-accent': '#33ff33',
    '--chipper-accent-bright': '#66ff66',
    '--chipper-accent-dim': '#22aa22',
    '--chipper-accent-glow': '#0a2a0a',
    '--chipper-focus-ring': '0 0 0 2px rgba(51, 255, 51, 0.3)',
    '--chipper-popup-shadow': '0 4px 12px rgba(0, 0, 0, 0.5)',
    // Chip colors — monochrome green at varying intensities
    '--chipper-color-copper-text': '#33ff33',
    '--chipper-color-copper-bg': '#0a1a0a',
    '--chipper-color-copper-hover': '#0f240f',
    '--chipper-color-sage-text': '#33ff33',
    '--chipper-color-sage-bg': '#0a1a0a',
    '--chipper-color-sage-hover': '#0f240f',
    '--chipper-color-slate-text': '#33ff33',
    '--chipper-color-slate-bg': '#0a1a0a',
    '--chipper-color-slate-hover': '#0f240f',
    '--chipper-color-stone-text': '#33ff33',
    '--chipper-color-stone-bg': '#0a1a0a',
    '--chipper-color-stone-hover': '#0f240f',
    '--chipper-color-teal-text': '#33ff33',
    '--chipper-color-teal-bg': '#0a1a0a',
    '--chipper-color-teal-hover': '#0f240f',
    '--chipper-color-rose-text': '#33ff33',
    '--chipper-color-rose-bg': '#0a1a0a',
    '--chipper-color-rose-hover': '#0f240f',
  },
};

// All overridable props across all themes (computed once)
const allThemeProps = new Set(
  Object.values(themeTokens).flatMap((t) => Object.keys(t)),
);

function applyTheme(themeName: string) {
  const root = document.documentElement;

  // Clear all overrides — SCSS cascade restores praxis defaults
  for (const prop of allThemeProps) {
    root.style.removeProperty(prop);
  }

  // Apply new theme tokens (praxis = empty, relies on SCSS)
  const tokens = themeTokens[themeName];
  if (tokens) {
    for (const [prop, value] of Object.entries(tokens)) {
      root.style.setProperty(prop, value);
    }
  }
}

const themePalette = extendPalette({
  chips: {
    theme: keywordDomain({
      color: 'slate',
      keywords: [
        { value: 'praxis', label: 'praxis' },
        { value: 'midnight', label: 'midnight' },
        { value: 'terminal', label: 'terminal' },
      ],
      default: 'praxis',
    }),
  },
});

const themeSentence = sentence(themePalette)
  .clause('theme', builder()
    .text('View this page in')
    .chip('theme')
    .text('theme.')
  )
  .build();

const meetingPalette = extendPalette({
  chips: {
    meetingDate: dateDomain({
      color: 'sage',
      keywords: [
        { value: 'tomorrow', label: 'tomorrow' },
        { value: 'next-monday', label: 'next Monday' },
      ],
      placeholder: 'a date',
    }),
  },
});

const meetingSentence = sentence(meetingPalette)
  .clause('meeting', builder()
    .text('Schedule a meeting for')
    .chip('meetingDate')
    .text('.')
  )
  .build();

const demoSentence = sentence(praxisPalette)
  .clause('cadence', builder()
    .text('Every')
    .chip('cadenceMeasure')
    .chip('cadenceUnit', { present: (ctx) => !isNaN(Number(ctx.cadenceMeasure)) })
    .produces({ cadenceMeasure: 'cadenceMeasure', cadenceUnit: 'cadenceUnit' })
  )
  .clause('dayOfWeek', builder()
    .text('on')
    .chip('dayOfWeek')
    .contingentOn('cadence', (ctx) => {
      if (ctx.cadenceMeasure === 'weekly') return true;
      if (!isNaN(Number(ctx.cadenceMeasure)))
        return ctx.cadenceUnit === 'week';
      return false;
    })
    .text(',')
  )
  .clause('dayOfMonth', builder()
    .text('on')
    .chip('dayOfMonth')
    .contingentOn('cadence', (ctx) => {
      if(ctx.cadenceMeasure === 'monthly') return true;
      if (!isNaN(Number(ctx.cadenceMeasure)))
        return ['month', 'quarter', 'year'].includes(ctx.cadenceUnit as string);
      return false;
    })
  )
  .clause('monthOfQuarter', builder()
    .text('of the')
    .chip('monthOfQuarter')
    .text('month')
    .contingentOn('cadence', (ctx) => ctx.cadenceUnit === 'quarter')
  )
    .clause('monthOfYear', builder()
    .text('of')
    .chip('monthOfYear')
    .contingentOn('cadence', (ctx) => ctx.cadenceUnit === 'year')
  )
  .clause('anchorDate', builder()
    .text('starting')
    .chip('cadenceOffset')
    .text(',')
    .contingentOn('cadence', (ctx) => {
      if (isNaN(Number(ctx.cadenceMeasure))) return false;
      return ctx.cadenceUnit !== 'day' && ctx.cadenceMeasure > 1
    })
  )
  .line()
  .clause('timeOfDay', builder()
    .optional()
    .text('at')
    .chip('timeOfDay')
    .text(',')
  )
  .line()
  .clause('verb', builder()
    .text('create a task named')
    .chip('taskName')
    .text('.')
  )
  .build();



//
//  DISPLAY LOGIC
//

const fontPanels = [
  {
    id: 'bookish',
    label: 'Bookish',
    font: '"Newsreader", Georgia, "Times New Roman", serif',
    size: '1rem',
  },
];

export function App() {
  const [inspectorState, setInspectorState] = useState<SentenceState | null>(null);

  return (
    <div className="demo-page">
      <header className="demo-header">
        <a
          className="demo-header__link"
          href="https://github.com/philosaether/chipper"
        >
          GitHub
        </a>
        <h1 className="demo-header__title">Chipper</h1>
        <p className="demo-header__subtitle">
          Plain-English editing interfaces for complex configuration.
        </p>
      </header>

      <section className="demo-section">
        <div className="demo-section__label">
          One sentence, six typefaces
        </div>
        <p className="demo-section__desc">
          Chipper inherits the consumer's font. Each panel below renders
          the same sentence in a different typographic context.
        </p>

        {fontPanels.map((panel) => (
          <div
            key={panel.id}
            className="demo-font-panel"
            style={{
              '--panel-font': panel.font,
              '--panel-size': panel.size,
            } as React.CSSProperties}
          >
            <div className="demo-font-panel__label">{panel.label}</div>
            <div className="demo-font-panel__sentence">
              <Chipper sentence={demoSentence} onChange={setInspectorState} />
            </div>
          </div>
        ))}
      </section>

      <section className="demo-section">
        <div className="demo-section__label">Theme toggle</div>
        <p className="demo-section__desc">
          A Chipper sentence that controls the page. Pick a theme and
          watch the colors change.
        </p>
        <div className="demo-font-panel">
          <div className="demo-font-panel__sentence">
            <Chipper
              sentence={themeSentence}
              onChange={(state) => {
                const theme = state.clauses['theme']?.chips['theme']?.value as string;
                if (theme) applyTheme(theme);
              }}
            />
          </div>
        </div>
      </section>

      <section className="demo-section">
        <div className="demo-section__label">Date expression</div>
        <p className="demo-section__desc">
          A calendar date picker as a KOE expression mode, with keyword shortcuts.
        </p>
        <div className="demo-font-panel">
          <div className="demo-font-panel__sentence">
            <Chipper sentence={meetingSentence} />
          </div>
        </div>
      </section>

      <section className="demo-section">
        <div className="demo-section__label">Sentence state</div>
        <pre className="demo-state-inspector">
          {inspectorState ? JSON.stringify(inspectorState, null, 2) : 'Interact with a panel above...'}
        </pre>
      </section>

      <section className="demo-section">
        <div className="demo-section__label">What's happening?</div>
        <div className="demo-explainer">
          <div className="demo-explainer__item">
            <span className="demo-explainer__term">Sentence. </span>
            <span className="demo-explainer__desc">
              A Chipper sentence is one complete unit of input. It reads like
              English, but every bracketed word is an interactive chip the user
              clicks to configure. Each panel has six chips using five different
              domain archetypes.
            </span>
          </div>
          <div className="demo-explainer__item">
            <span className="demo-explainer__term">Domain. </span>
            <span className="demo-explainer__desc">
              Every chip is bound to a domain that defines its value space.
              Cadence is keyword-or-expression (presets collapse the detail
              clause; numeric input expands it via the contingency engine).
              Genre is a reference domain (hierarchical tree with search).
              Instruments and days are multi-select (toggle grid).
              Volume is keyword-or-expression with a numeric stepper.
            </span>
          </div>
          <div className="demo-explainer__item">
            <span className="demo-explainer__term">Theme. </span>
            <span className="demo-explainer__desc">
              Chipper's colors come from CSS custom properties. The panels
              above all share the same praxis theme — only the font changes.
              Consumers can provide their own theme by overriding the
              <code> --chipper-*</code> tokens.
            </span>
          </div>
        </div>
      </section>

      <footer className="demo-footer">
        v0.2 · chipper
      </footer>
    </div>
  );
}
