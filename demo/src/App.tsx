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
  referenceDomain,
} from 'chipper';
import type { ReferenceItem, SentenceState } from 'chipper';
import 'chipper/styles.css';
import './demo.css';

const months = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December',
];

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
      { id: 'dubstep', label: "Dubstep"},
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
      countLabel: 'instruments',
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
  .clause('when', clause()
    .required()
    .text('On')
    .chip('day', 'day')
    .text('of')
    .chip('month', 'month')
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
              Month is a pure enum (fixed list). Alarm is keyword-or-expression
              (presets + freeform). Genre is a reference domain (hierarchical
              tree with search). Instruments is multi-select (toggle grid).
              Day is alternative-coordinate (tabbed modes with different DOF).
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
