# Media Dashboard V3.3 — Creative Interaction Lab

This wireframe uses a progressive-enhancement animation stack. All dashboards remain read-only and functional if third-party CDN requests fail.

## Pinned open-source dependencies

| Library | Version | Distribution | Role |
| --- | --- | --- | --- |
| Anime.js | 4.0.0 | https://cdn.jsdelivr.net/npm/animejs@4.0.0/+esm | Staggered Creative Flow symbol choreography |
| Motion (JavaScript) | 11.13.5 | https://cdn.jsdelivr.net/npm/motion@11.13.5/+esm | Spring hover gestures and in-view accents |
| Animate.css | 4.1.1 | https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css | Short page-title and detail-heading entrance effects |

See official documentation at https://animejs.com/documentation/, https://motion.dev/docs and https://animate.style/. Dependencies are version pinned, free/open-source, and require no API keys or billing.

## Design architecture

- **interaction-v33.css:** consistent hover/focus response for cards, KPIs, charts, Kanban items, row details, calendars, progress surfaces, tables, modals and filters.
- **interaction-v33.js:** dynamically imports Anime.js and Motion on an ordinary static GitHub Pages website. Animations operate only on decorative elements. It exposes `window.MediaStudioInteractions` as a lightweight availability diagnostic.
- **Overview Creative Flow:** four-stage editorial strip (Plan / Create / Review / Publish) routes directly to the existing Content Pipeline. These are conceptual stages, not additional Airtable metrics.
- **Motion on/off:** existing control pauses optional animations. OS `prefers-reduced-motion` is respected.
- **Animate.css:** loaded as a version-pinned stylesheet. If unavailable, headings remain legible and the dashboard works without it.
- **Graceful degradation:** local CSS effects are the baseline. Animations never govern routing, data display, controls, or record details.

## Testing

GitHub Actions runs `tests/v33-interactions.cjs` on an HTTP-served local build at 1440, 834, 390, and 320px, plus motion pause / reduced-motion checks. Previous tests continue covering the splash, seven workspace dashboards, centered popups and three-month calendar.

## Data policy

Every displayed record remains fictional sample data. There are no Airtable writes, backend mutations, new authentication steps, or external data connections in this release.
