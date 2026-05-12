import { useState } from 'react';
import {
  Chipper,
  sentence,
  clause,
  extendPalette,
  enumDomain,
  keywordOrExpressionDomain,
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
  },
});

const demoSentence = sentence(demoPalette)
  .clause('when', clause()
    .required()
    .text('Wake me up when')
    .chip('month', 'month')
    .text('ends. Play')
    .chip('alarm', 'alarm')
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
              clicks to configure. The sentence above has two chips — a month
              and what to play.
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
              Every chip is bound to a domain that defines its value space. The
              month chip uses an enum domain — a fixed list of keywords. The
              alarm chip uses a keyword-or-expression domain — presets plus
              freeform text input.
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
