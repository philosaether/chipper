import { useState } from 'react';
import {
  Chipper,
  sentence,
  clause,
  extendPalette,
  enumDomain,
  keywordOrExpressionDomain,
  multiSelectDomain,
  alternativeCoordinateDomain,
} from 'chipper';
import type { SentenceState } from 'chipper';
import 'chipper/styles.css';
import './demo.css';

const months = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December',
];

const demoPalette = extendPalette({
  domains: {
    month: enumDomain({
      color: 'copper',
      keywords: months.map((m) => ({ label: m, value: m.toLowerCase() })),
      placeholder: 'a month',
    }),
    alarm: keywordOrExpressionDomain({
      color: 'slate',
      keywords: [
        { label: 'my alarm', value: 'my alarm' },
        { label: 'the fire alarm', value: 'the fire alarm' },
        { label: 'the national anthem', value: 'the national anthem' },
      ],
      expression: {
        placeholder: 'something specific',
        maxLength: 100,
      },
      placeholder: 'something',
    }),
    instruments: multiSelectDomain({
      color: 'sage',
      options: [
        { label: 'guitar', value: 'guitar' },
        { label: 'drums', value: 'drums' },
        { label: 'bass', value: 'bass' },
        { label: 'keys', value: 'keys' },
        { label: 'horns', value: 'horns' },
        { label: 'strings', value: 'strings' },
      ],
      keywords: [
        { label: 'full band', value: ['guitar', 'drums', 'bass', 'keys'] },
        { label: 'unplugged', value: ['guitar', 'strings'] },
      ],
      placeholder: 'instruments',
    }),
    day: alternativeCoordinateDomain({
      color: 'rose',
      modes: [
        {
          id: 'date',
          label: 'Date',
          slots: [
            { prefix: 'the', keywords: [
              { label: '1st', value: '1' },
              { label: '15th', value: '15' },
              { label: 'last day', value: 'last' },
            ]},
          ],
          compose: (day) => day,
          decompose: (v) => [v],
          expression: {
            placeholder: 'day of month (1-31)',
            validate: (v) => /^([1-9]|[12]\d|3[01])$/.test(v),
          },
        },
        {
          id: 'weekday',
          label: 'Weekday',
          slots: [
            { prefix: 'the', keywords: [
              { label: 'first', value: 'first' },
              { label: 'second', value: 'second' },
              { label: 'third', value: 'third' },
              { label: 'fourth', value: 'fourth' },
              { label: 'last', value: 'last' },
            ]},
            { keywords: [
              { label: 'Mon', value: 'monday' },
              { label: 'Tue', value: 'tuesday' },
              { label: 'Wed', value: 'wednesday' },
              { label: 'Thu', value: 'thursday' },
              { label: 'Fri', value: 'friday' },
              { label: 'Sat', value: 'saturday' },
              { label: 'Sun', value: 'sunday' },
            ]},
          ],
          compose: (ordinal, day) => `${ordinal} ${day}`,
          decompose: (v) => {
            const parts = v.split(' ');
            return parts.length === 2 ? parts : [undefined, undefined];
          },
        },
      ],
      placeholder: 'a day',
    }),
  },
});

const demoSentence = sentence(demoPalette)
  .clause('when', clause()
    .required()
    .text('On')
    .chip('day', 'day')
    .text('of')
    .chip('month', 'month')
    .text(', play')
    .chip('alarm', 'alarm')
    .text('with')
    .chip('instruments', 'instruments')
    .text('.'))
  .build();

export function App() {
  const [state, setState] = useState<SentenceState | null>(null);

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
        <div className="demo-section__label">Try it</div>
        <div className="demo-sentence-wrapper">
          <Chipper sentence={demoSentence} onChange={setState} />
        </div>
      </section>

      <section className="demo-section">
        <div className="demo-section__label">Sentence state</div>
        <pre className="demo-state-inspector">
          {state ? JSON.stringify(state, null, 2) : 'Loading...'}
        </pre>
      </section>

      <section className="demo-section">
        <div className="demo-section__label">What just happened?</div>
        <div className="demo-explainer">
          <div className="demo-explainer__item">
            <span className="demo-explainer__term">Sentence. </span>
            <span className="demo-explainer__desc">
              A Chipper sentence is one complete unit of input. It reads like
              English, but every bracketed word is an interactive chip the user
              clicks to configure. The sentence above has four chips — each
              using a different domain archetype.
            </span>
          </div>
          <div className="demo-explainer__item">
            <span className="demo-explainer__term">Chip. </span>
            <span className="demo-explainer__desc">
              A chip is a single configurable value. Click it, pick from
              presets or type your own, and the sentence updates. The chip
              knows how to validate its value, display it, and tell you when
              something's missing.
            </span>
          </div>
          <div className="demo-explainer__item">
            <span className="demo-explainer__term">Domain. </span>
            <span className="demo-explainer__desc">
              Every chip is bound to a domain that defines its value space.
              Month is a pure enum (fixed list). Alarm is keyword-or-expression
              (presets + freeform). Instruments is multi-select (toggle grid).
              Day is alternative-coordinate (tabbed modes with different DOF).
            </span>
          </div>
        </div>
      </section>

      <footer className="demo-footer">
        v0.1 · More examples coming soon.
      </footer>
    </div>
  );
}
