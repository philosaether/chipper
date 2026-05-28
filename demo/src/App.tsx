import { useState } from 'react';
import {
  Chipper,
  sentence,
  builder,
  extendPalette,
  keywordDomain,
  textDomain,
  dateDomain,
  referenceDomain,
} from 'chipper';
import type { ReferenceItem, SentenceState } from 'chipper';
import 'chipper/styles.css';
import './demo.css';
import { praxisPalette } from './praxis-palette';

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

//
//  REFERENCE DOMAIN DEMO
//

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
      { id: 'dubstep', label: 'Dubstep' },
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

const genrePalette = extendPalette({
  chips: {
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
  },
});

const genreSentence = sentence(genrePalette)
  .clause('genrePicker', builder()
    .text('Play something in the')
    .chip('genre')
    .text('genre.')
    .produces({genre: 'genre'})
  )
  .line()
  .clause('genreDisplay', builder()
    .text('You are listening to')
    .contingentOn('genrePicker')
    .chip('computedGenre', 'genre', {
      display: (ctx) => ctx.genre
    })
  )
  .build();

const demoSentence = sentence(praxisPalette)
  .clause('cadence', builder()
    .text('Every')
    .chip('cadenceMeasure')
    .chip('cadenceUnit', 'timeUnit', { present: (ctx) => !isNaN(Number(ctx.cadenceMeasure)) })
    .punc({ present: (ctx) => ['daily', 'weekday', 'weekend'].includes(ctx.cadenceMeasure as string)})
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
    .punc()
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
    .punc()
  )
  .clause('monthOfQuarter', builder()
    .text('of the')
    .chip('monthOfQuarter')
    .text('month')
    .contingentOn('cadence', (ctx) => ctx.cadenceUnit === 'quarter')
    .punc()
  )
  .clause('monthOfYear', builder()
    .text('of')
    .chip('monthOfYear')
    .contingentOn('cadence', (ctx) => ctx.cadenceUnit === 'year')
    .punc()
  )
  .clause('anchorDate', builder()
    .text('starting')
    .chip('cadenceOffset')
    .contingentOn('cadence', (ctx) => {
      if (isNaN(Number(ctx.cadenceMeasure))) return false;
      return ctx.cadenceUnit !== 'day' && ctx.cadenceMeasure > 1
    })
    .punc()
  )
  .line()
  .clause('timeOfDay', builder()
    .optional()
    .text('at')
    .chip('timeOfDay')
    .punc()
  )
  .line()
  .clause('verb', builder()
    .text('create a task named')
    .chip('taskName')
    .text('in')
    .chip('targetProject', 'project', {
      display: 'praxis',
      info: 'Praxis is the only project we support right now.'
    })
    .punc()
  )
  .line()
  .clause('dueMeasure', builder()
    .optional()
    .text('due')
    .chip('dueMeasure')
    .chip('dueUnit', 'timeUnit', { present: (ctx) => !isNaN(Number(ctx.dueMeasure)) })
    .produces({dueMeasure: 'dueMeasure'})
    .punc()
  )
  .build();



//
//  REMOTE SOURCE DEMO — fetch philbas.com Featured Writing title
//

const featuredPalette = extendPalette({
  chips: {
    featuredTitle: textDomain({
      color: 'plum',
      placeholder: 'loading…',
    }),
  },
});

const featuredSentence = sentence(featuredPalette)
  .clause('featured', builder()
    .text("Phil's featured writing is")
    .chip('featuredTitle', 'featuredTitle', {
      display: {
        url: 'https://philbas.com',
        extract: (response: unknown) => {
          const html = response as string;
          const match = html.match(/<h3[^>]*class="[^"]*featured[^"]*"[^>]*>(.*?)<\/h3>/i)
            ?? html.match(/<h3[^>]*>(.*?)<\/h3>/i);
          return match?.[1]?.replace(/<[^>]+>/g, '').trim() ?? 'unknown';
        },
      },
      info: 'Fetched from philbas.com — may fail due to CORS in dev.',
    })
    .text('.')
  )
  .build();

//
//  EXTERNAL SOURCE DEMO — live weather with city/unit selection
//

interface CityConfig {
  label: string;
  value: string;
  lat: number;
  lon: number;
}

const cities: CityConfig[] = [
  { label: 'New York', value: 'nyc', lat: 40.71, lon: -74.01 },
  { label: 'London', value: 'london', lat: 51.51, lon: -0.13 },
  { label: 'Tokyo', value: 'tokyo', lat: 35.68, lon: 139.69 },
  { label: 'Sydney', value: 'sydney', lat: -33.87, lon: 151.21 },
  { label: 'São Paulo', value: 'saopaulo', lat: -23.55, lon: -46.63 },
  { label: 'Cairo', value: 'cairo', lat: 30.04, lon: 31.24 },
  { label: 'Mumbai', value: 'mumbai', lat: 19.08, lon: 72.88 },
  { label: 'Reykjavik', value: 'reykjavik', lat: 64.15, lon: -21.94 },
];

/** Shared weather cache — updated by the external subscription, read by derived chips. */
const weatherCache: Record<string, number> = {};

function convertTemp(celsius: number, unit: string): string {
  switch (unit) {
    case 'fahrenheit': return String(Math.round(celsius * 9 / 5 + 32));
    case 'kelvin': return String(Math.round(celsius + 273.15));
    default: return String(Math.round(celsius));
  }
}

/**
 * Subscribe to weather data for all cities.
 * Fetches from Open-Meteo (free, no API key, CORS-friendly).
 * Pushes updates to the callback — the callback value is the raw cache object.
 */
function subscribeToWeather(callback: (value: Record<string, number>) => void): () => void {
  let active = true;

  const fetchAll = async () => {
    const lats = cities.map((c) => c.lat).join(',');
    const lons = cities.map((c) => c.lon).join(',');
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m`
      );
      const data = await response.json();
      // Open-Meteo returns an array when given multiple coordinates
      const results = Array.isArray(data) ? data : [data];
      for (let i = 0; i < cities.length && i < results.length; i++) {
        weatherCache[cities[i]!.value] = results[i]?.current?.temperature_2m ?? 0;
      }
      if (active) callback({ ...weatherCache });
    } catch {
      // Silently fail — display chip will show last known value or placeholder
    }
  };

  fetchAll();
  const intervalId = setInterval(fetchAll, 60_000); // refresh every 60s
  return () => { active = false; clearInterval(intervalId); };
}

const weatherPalette = extendPalette({
  chips: {
    weatherTemp: textDomain({
      color: 'teal',
      placeholder: '…',
    }),
    weatherUnit: keywordDomain({
      color: 'teal',
      keywords: [
        { value: 'fahrenheit', label: 'Fahrenheit' },
        { value: 'celsius', label: 'Celsius' },
        { value: 'kelvin', label: 'Kelvin' },
      ],
      default: 'fahrenheit',
    }),
    weatherCity: keywordDomain({
      color: 'teal',
      keywords: cities.map((c) => ({ value: c.value, label: c.label })),
      default: 'nyc',
    }),
  },
});

const weatherSentence = sentence(weatherPalette)
  .clause('weather', builder()
    .text('It is')
    .chip('weatherTemp', 'weatherTemp', {
      display: { subscribe: subscribeToWeather },
      info: 'Live data from Open-Meteo. Updates every 60 seconds.',
    })
    .text('degrees')
    .chip('weatherUnit')
    .text('in')
    .chip('weatherCity')
    .produces({ weatherCity: 'weatherCity', weatherUnit: 'weatherUnit' })
    .text('right now.')
  )
  .line()
  .clause('weatherDerived', builder()
    .text('That\'s')
    .contingentOn('weather')
    .chip('convertedTemp', 'weatherTemp', {
      display: (ctx) => {
        const city = (ctx.weatherCity as string) || 'nyc';
        const unit = (ctx.weatherUnit as string) || 'fahrenheit';
        const celsius = weatherCache[city];
        if (celsius === undefined) return '…';
        return convertTemp(celsius, unit);
      },
      info: (value) => `Converted from Celsius (source: Open-Meteo)`,
    })
    .text('degrees')
    .chip('derivedUnit', 'weatherUnit', {
      display: (ctx) => ctx.weatherUnit as string || 'fahrenheit',
    })
    .text('in')
    .chip('derivedCity', 'weatherCity', {
      display: (ctx) => {
        const cityVal = ctx.weatherCity as string || 'nyc';
        return cities.find((c) => c.value === cityVal)?.label ?? cityVal;
      },
    })
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
        <div className="demo-section__label">Reference domain</div>
        <p className="demo-section__desc">
          A hierarchical tree with drill-in navigation and search.
          Try drilling into Electronic, or searching for &ldquo;fusion&rdquo;.
        </p>
        <div className="demo-font-panel">
          <div className="demo-font-panel__sentence">
            <Chipper sentence={genreSentence} />
          </div>
        </div>
      </section>

      <section className="demo-section">
        <div className="demo-section__label">Remote source</div>
        <p className="demo-section__desc">
          A display chip that fetches data from a URL. This one tries to
          pull the featured writing title from philbas.com. If CORS blocks
          it, you&rsquo;ll see the error state.
        </p>
        <div className="demo-font-panel">
          <div className="demo-font-panel__sentence">
            <Chipper sentence={featuredSentence} />
          </div>
        </div>
      </section>

      <section className="demo-section">
        <div className="demo-section__label">External source</div>
        <p className="demo-section__desc">
          Display chips fed by a live subscription. The first line shows
          raw data from Open-Meteo; the second line derives converted
          values from the city and unit you pick.
        </p>
        <div className="demo-font-panel">
          <div className="demo-font-panel__sentence">
            <Chipper sentence={weatherSentence} />
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
