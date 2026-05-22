import { useState } from 'react';
import {
  Chipper,
  sentence,
  clause,
  extendPalette,
  keywordDomain,
  keywordOrExpressionDomain,
  multiSelectDomain,
  referenceDomain,
} from 'chipper';
import type { ReferenceItem, SentenceState } from 'chipper';
import 'chipper/styles.css';
import './demo.css';

// Genre tree for reference domain demo
interface GenreNode {
  id: string;
  label: string;
  selectable?: boolean;
  children?: GenreNode[];
}

const genreTree: GenreNode[] = [
  {
    id: 'rock', label: 'Rock', children: [
      { id: 'classic-rock', label: 'Classic Rock' },
      { id: 'punk', label: 'Punk' },
      { id: 'alternative', label: 'Alternative' },
    ],
  },
  {
    id: 'jazz', label: 'Jazz', children: [
      { id: 'bebop', label: 'Bebop' },
      { id: 'fusion', label: 'Fusion' },
      { id: 'smooth-jazz', label: 'Smooth Jazz' },
    ],
  },
  {
    id: 'electronic', label: 'Electronic', selectable: false, children: [
      { id: 'house', label: 'House' },
      { id: 'techno', label: 'Techno' },
      { id: 'ambient', label: 'Ambient' },
      { id: 'dubstep', label: 'Dubstep', children: [
        {id: 'skrillex', label: 'Skrillex'},
        {id: 'royksopp', label: 'Röyksopp', children: [
          {id: 'moment', label: 'Only This Moment', children: [
            {id: 'good-part', label: 'The good part', children: [
              {id: 'chills', label: 'Like the *really* good part'}
            ]}
          ]}
        ]}
      ]},
    ],
  },
  {
    id: 'classical', label: 'Classical', children: [
      { id: 'baroque', label: 'Baroque' },
      { id: 'romantic', label: 'Romantic' },
      { id: 'modern', label: 'Modern' },
    ],
  },
];

function flattenGenreTree(nodes: GenreNode[]): GenreNode[] {
  const result: GenreNode[] = [];
  for (const node of nodes) {
    result.push(node);
    if (node.children) result.push(...flattenGenreTree(node.children));
  }
  return result;
}

const allGenres = flattenGenreTree(genreTree);

function genreToReferenceItem(node: GenreNode): ReferenceItem {
  return {
    id: node.id,
    label: node.label,
    hasChildren: (node.children?.length ?? 0) > 0,
    selectable: node.selectable,
  };
}

function findGenrePath(id: string, nodes: GenreNode[], path: string[] = []): string[] | null {
  for (const node of nodes) {
    if (node.id === id) return [...path, node.label];
    if (node.children) {
      const found = findGenrePath(id, node.children, [...path, node.label]);
      if (found) return found;
    }
  }
  return null;
}

// Cadence collapse keywords — selecting these hides the detail clause
const cadenceCollapseKeywords = ['daily', 'weekday', 'weekend day'];

const demoPalette = extendPalette({
  domains: {
    cadence: keywordOrExpressionDomain({
      color: 'copper',
      keywords: [
        { label: 'daily', value: 'daily' },
        { label: 'weekday', value: 'weekday' },
        { label: 'weekend day', value: 'weekend day' },
      ],
      expression: {
        inputType: 'number',
        min: 1,
        max: 52,
        step: 1,
        placeholder: 'every N...',
        validate: (v) => /^\d+$/.test(v) && Number(v) >= 1,
      },
      defaultValue: 'weekday',
      placeholder: 'how often',
    }),
    period: keywordDomain({
      color: 'copper',
      keywords: [
        { label: 'days', value: 'days' },
        { label: 'weeks', value: 'weeks' },
        { label: 'months', value: 'months' },
      ],
      placeholder: 'period',
    }),
    daySet: multiSelectDomain({
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
        { label: 'weekdays', value: ['mon', 'tue', 'wed', 'thu', 'fri'] },
        { label: 'weekends', value: ['sat', 'sun'] },
      ],
      placeholder: 'which days',
      countLabel: 'days',
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
      countLabel: 'instruments',
    }),
    genre: referenceDomain({
      color: 'indigo',
      source: {
        getItems: (path) => {
          let nodes = genreTree;
          for (const item of path) {
            const found = nodes.find((n) => n.id === item.id);
            nodes = found?.children ?? [];
          }
          return nodes.map(genreToReferenceItem);
        },
        search: (query) =>
          allGenres
            .filter((g) => g.label.toLowerCase().includes(query.toLowerCase()))
            .map(genreToReferenceItem),
        resolveDisplay: (id) => {
          const path = findGenrePath(id, genreTree);
          return path ? path.join(' › ') : id;
        },
      },
      placeholder: 'a genre',
    }),
    volume: keywordOrExpressionDomain({
      color: 'gold',
      keywords: [
        { label: 'whisper', value: '1' },
        { label: 'moderate', value: '5' },
        { label: 'max', value: '10' },
      ],
      expression: {
        inputType: 'number',
        min: 1,
        max: 10,
        step: 1,
        placeholder: 'volume level',
        validate: (v) => {
          const n = Number(v);
          return !isNaN(n) && n >= 1 && n <= 10;
        },
      },
      placeholder: 'a volume',
    }),
  },
});

const demoSentence = sentence(demoPalette)
  .clause('cadence', clause()
    .required()
    .text('Every')
    .chip('cadence', 'cadence')
    .produces({ cadence: 'cadence' })
  )
  .clause('cadence-detail', clause()
    .required()
    .contingentOn('cadence', {
      present: (ctx) => !cadenceCollapseKeywords.includes(ctx.cadence as string),
    })
    .chip('period', 'period')
    .text('on')
    .chip('daySet', 'daySet')
  )
  .clause('action', clause()
    .required()
    .text(', play')
    .chip('alarm', 'alarm')
    .text('from')
    .chip('genre', 'genre')
    .text('at')
    .chip('volume', 'volume')
    .text('with')
    .chip('instruments', 'instruments')
    .text('.'))
  .build();

const fontPanels = [
  {
    id: 'bookish',
    label: 'Bookish',
    font: '"Newsreader", Georgia, "Times New Roman", serif',
    size: '1rem',
  },
  {
    id: 'minimalist',
    label: 'Minimalist',
    font: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    size: '0.9375rem',
  },
  {
    id: 'government',
    label: 'Government',
    font: '"Times New Roman", Times, serif',
    size: '1rem',
  },
  {
    id: 'startup',
    label: 'Startup',
    font: '"DM Sans", "Helvetica Neue", Helvetica, sans-serif',
    size: '1.0625rem',
  },
  {
    id: 'terminal',
    label: 'Terminal',
    font: '"SF Mono", "Fira Code", "Fira Mono", Menlo, monospace',
    size: '0.875rem',
  },
  {
    id: 'brutalist',
    label: 'Brutalist',
    font: 'Arial, sans-serif',
    size: '1.125rem',
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
