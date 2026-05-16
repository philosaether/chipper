import { useState } from 'react';
import {
  Chipper,
  sentence,
  builder,
  line,
  extendPalette,
  enumDomain,
  keywordOrExpressionDomain,
  multiSelectDomain,
  referenceDomain,
} from 'chipper';
import type { ReferenceItem, SentenceState, ClauseBuilder } from 'chipper';
import 'chipper/styles.css';
import './demo.css';

//
//  CHIPPER CONFIG
//

const myPalette = extendPalette({
  chips: {
    intent: keywordOrExpressionDomain({
      color: 'rose',
      keywords: [
        { value: 'wake', label: 'Wake me up' },
        { value: 'take', label: 'Take me' },
        { value: 'bring', label: 'Bring me' },
      ],
      default: 'wake',
    }),
    condition: keywordOrExpressionDomain({
      color: 'indigo',
      keywords: [
        { value: 'september', label: 'when September ends' },
        { value: 'inside', label: 'inside' },
        { value: 'go', label: 'before you go-go' }
      ],
      placeholder: 'eventually',
    }),
    destination: keywordOrExpressionDomain({
      color: 'plum',
      keywords: [
        { value: 'church', label: 'to church' },
        { value: 'you', label: 'with you' },
        { value: 'love', label: 'a higher love' },
      ],
      default: 'you',
      expression: {
        placeholder: 'what I need',
        maxLength: 100,
      },
    })
  }
})

const demoSentence = sentence(myPalette)
  .clause('request', builder()
    .chip('intent')
    .produces({intent: 'intent'})
  )
  .clause('condition', builder()
    .chip('condition')
    .contingentOn('request', {
      present: (ctx) => { return ctx.intent === 'wake' }
    })
  )
  .clause('destination', builder()
    .chip('destination')
    .contingentOn('request', {
      present: (ctx) => { return ['bring', 'take'].includes(ctx.intent as string) }
    })
  )
  .line({indent: true})
  .clause('next', builder()
    .text('and do something!')
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
