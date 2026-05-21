import { useState } from 'react';
import {
  Chipper,
  sentence,
  builder,
  line,
  extendPalette,
  enumDomain,
  keywordOrExpressionDomain,
  numericExpression,
  dateExpression,
  multiSelectDomain,
  alternativeCoordinateDomain,
  referenceDomain,
} from 'chipper';
import type { ReferenceItem, SentenceState, ClauseBuilder } from 'chipper';
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
        { value: 'weekly', label: 'week on...', display: 'week' },
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
    cadenceUnit: keywordOrExpressionDomain({
      color: 'copper',
      keywords: [
        { value: 'day', label: 'days' },
        { value: 'week', label: 'weeks' },
        { value: 'month', label: 'months' },
        { value: 'quarter', label: 'quarters' },
        { value: 'year', label: 'years' },
      ]
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
              { label: 'last', value: 'last' },
            ],
          }],
          expression: dateExpression({
            placeholder: 'pick a date'
          }),
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
      placeholder: 'which day',
    }),
  }
})

const meetingPalette = extendPalette({
  chips: {
    meetingDate: keywordOrExpressionDomain({
      color: 'sage',
      keywords: [
        { value: 'tomorrow', label: 'tomorrow' },
        { value: 'next-monday', label: 'next Monday' },
      ],
      expression: dateExpression({
        trigger: { label: 'pick a date', default: '' },
      }),
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
    .contingentOn('cadence', {
      present: (ctx) => {
        if (ctx.cadenceMeasure === 'weekly') return true;
        if (!isNaN(Number(ctx.cadenceMeasure)))
          return ctx.cadenceUnit === 'week';
        return false;
      },
    })
    .text(',')
  )
  .clause('dayOfMonth', builder()
    .text('on')
    .chip('dayOfMonth')
    .contingentOn('cadence', {
      present: (ctx) => {
        if (!isNaN(Number(ctx.cadenceMeasure)))
          return ['month', 'quarter'].includes(ctx.cadenceUnit as string);
        return false;
      },
    })
    .text(',')
  )
  .clause('anchorDate', builder()
    .text('starting')
    .chip('cadenceOffset')
    .text(',')
    .contingentOn('cadence', {
      present: (ctx) => {
        if (isNaN(Number(ctx.cadenceMeasure))) return false;
        return ctx.cadenceUnit !== 'day' && ctx.cadenceMeasure > 1
      }
    })
  )
  .build()


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
