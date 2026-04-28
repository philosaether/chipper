# CLAUDE.md

## Session Start

Read these files first:
- `.meta/decisions.md` - Architectural decisions (append-only log)
- `.meta/in-progress.md` - Current work state
- `.meta/designs/chipper-architecture.md` - The architectural blueprint

## Project Purpose

Chipper is a standalone open-source React library for building plain-English
editing interfaces. Users construct complex configurations by clicking semantic
chips arranged in readable sentences.

Strategic context: Chipper is extracted from Praxis (~/Development/praxis/),
which remains the primary consumer. The library ships independently with its
own docs, demo, and npm package before Praxis reaches beta.

## Architecture

See `chipper-architecture.md` for the full picture. Key concepts:
- Sentence > Clause > Chip hierarchy
- Domains define chip value spaces (six archetypes)
- Palettes provide reusable domain configs
- Builder API composes sentences from palette pieces

| Layer | Choice |
|-------|--------|
| Language | TypeScript (strict) |
| Framework | React 18/19 (peer dep) |
| Build | Vite (library mode) |
| Test | Vitest |
| Styling | BEM + CSS custom properties |

## Development Workflow

Multi-contributor project. Design docs in `.meta/designs/` are the shared
source of truth. Code changes should trace back to the architecture doc
or a decision in `decisions.md`.

## Conventions

- Strict TypeScript, no `any`
- Verbose, descriptive names
- One concern per file, 500 lines max
- Tests alongside implementation
- BEM class names prefixed with `chipper-`

## Skills

This project includes Claude Code skills in `.claude/skills/`.
Key workflow: `/hello` (start) → `/assess` and/or `/draft` (design) →
`/review` (pre-merge) → `/ttyl` (end session).

Design docs in `.meta/designs/` are the shared source of truth.
Use `/draft` to create them, `/ship` to begin implementation.

## Related Repos

- `~/Development/praxis/` — Primary consumer (Praxis task management)
- `~/Development/praxis/.meta/` — Praxis architecture docs (has original Chipper design work)
