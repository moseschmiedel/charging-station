# Charging Station Docs

Astro Starlight documentation site for the `charging-station` workspace.

## Scope

This site documents:

- firmware architecture and tuning (`master/`, `slave/`, `ir_meter/`, `motor/`)
- hardware and signal-path assumptions
- beacon-tracking and drive-control behavior
- developer workflow and build/flash commands

## Local development

```bash
cd charging-station/docs
bun install
bun run dev
```

Open `http://localhost:4321`.

## Production build

```bash
cd charging-station/docs
bun run build
bun run preview
```

Static output is written to `docs/dist/`.

## Regenerate code API reference

Code reference pages are rendered from XML in `src/code-reference/`.
Regenerate XML from repository root:

```bash
cd charging-station
python3 scripts/generate_doxygen_docs.py
```

Then run the docs build/dev server to render:

```bash
cd charging-station/docs
bun run build
```

## Structure

- `src/content/docs/`: documentation pages (`guides/`, `reference/`, `index.mdx`)
- `src/code-reference/`: generated Doxygen XML grouped by project
- `src/assets/`: local images used by docs pages
- `public/`: static files served as-is
- `astro.config.mjs`: Starlight site configuration/sidebar
