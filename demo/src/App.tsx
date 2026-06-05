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
import {
  applyTheme,
  clearTheme,
  praxisTheme,
  midnightTheme,
  terminalTheme,
} from 'chipper/themes';
import type { ChipperTheme } from 'chipper';
import 'chipper/styles.css';
import './demo.css';
import { praxisPalette } from './praxis-palette';

//
//  THEME TOGGLE
//

const themesByName: Record<string, ChipperTheme> = {
  praxis: praxisTheme,
  midnight: midnightTheme,
  terminal: terminalTheme,
};

/** All hue roles used across demo palettes — enables fallback for themes
 *  that don't define every role (e.g., terminal). */
const demoHueRoles = ['gold', 'plum', 'copper', 'sage', 'slate', 'stone', 'teal', 'rose', 'umber', 'indigo'];

function switchTheme(themeName: string) {
  const theme = themesByName[themeName];
  if (!theme) return;

  if (themeName === 'praxis') {
    // SCSS cascade provides praxis values — just clear overrides
    clearTheme();
  } else {
    applyTheme(theme, { hueRoles: demoHueRoles });
  }

  // Demo-specific: match page font for terminal theme (separate concern)
  if (themeName === 'terminal') {
    document.documentElement.style.setProperty(
      '--demo-font', "'SF Mono', 'Fira Code', 'Fira Mono', Menlo, monospace",
    );
  } else {
    document.documentElement.style.removeProperty('--demo-font');
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
 * Pushes the default city (NYC) temperature in Fahrenheit as a string.
 * Also populates the shared weatherCache for derived chips.
 */
function subscribeToWeather(callback: (value: string) => void): () => void {
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
      if (active) {
        const nycCelsius = weatherCache['nyc'] ?? 0;
        callback(convertTemp(nycCelsius, 'fahrenheit'));
      }
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

//
//  COCKTAIL DEMO — exercises .a() and .period()
//

const cocktailPalette = extendPalette({
  chips: {
    mood: keywordDomain({
      color: 'copper',
      keywords: [
        { value: 'refreshing' },
        { value: 'strong' },
        { value: 'bitter' },
        { value: 'elegant' },
        { value: 'adventurous' },
      ],
      default: 'refreshing',
    }),
    spirit: keywordDomain({
      color: 'copper',
      keywords: [
        { value: 'whiskey' },
        { value: 'gin' },
        { value: 'tequila' },
        { value: 'rum' },
        { value: 'vodka' },
      ],
      default: 'gin',
    }),
    method: keywordDomain({
      color: 'sage',
      keywords: [
        { value: 'shaken' },
        { value: 'stirred' },
      ],
      default: 'shaken',
    }),
    serve: keywordDomain({
      color: 'sage',
      keywords: [
        { value: 'on the rocks' },
        { value: 'neat' },
        { value: 'up' },
      ],
      default: 'on the rocks',
    }),
  },
});

const cocktailSentence = sentence(cocktailPalette)
  .clause('order', builder()
    .text("I want")
    .a()
    .chip('mood')
    .text('drink with')
    .chip('spirit')
    .punc()
    .produces({ mood: 'mood', spirit: 'spirit' })
  )
  .line()
  .clause('method', builder()
    .optional()
    .contingentOn('order', () => true)
    .chip('method')
    .text('not')
    .chip('methodInverse', 'method', {
      display: (ctx) =>
        (ctx.method as string) === 'stirred' ? 'shaken' : 'stirred',
    })
    .punc()
    .produces({ method: 'method' })
  )
  .line()
  .clause('serve', builder()
    .optional()
    .contingentOn('order', () => true)
    .text('Served')
    .chip('serve')
    .period()
  )
  .build();

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
        <div className="demo-section__label">Article &amp; period helpers</div>
        <p className="demo-section__desc">
          Uses <code>.a()</code> for dynamic &ldquo;a&rdquo;/&ldquo;an&rdquo; and <code>.period()</code> for
          sentence-terminal punctuation. Try changing the mood to
          &ldquo;elegant&rdquo; and watch the article switch to &ldquo;an&rdquo;.
        </p>
        <div className="demo-font-panel">
          <div className="demo-font-panel__sentence">
            <Chipper sentence={cocktailSentence} />
          </div>
        </div>
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
                const themeName = state.clauses['theme']?.chips['theme']?.value as string;
                if (themeName) switchTheme(themeName);
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
        v0.1.0 · chipper
      </footer>
    </div>
  );
}
