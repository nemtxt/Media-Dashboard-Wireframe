# Media Dashboard V3.12 — pastel dashboard hierarchy

- Fix: The V3.8 overview grid is now visible only when Overview is active. Previously it also appeared below Settings & Data and other screens because of an unconditional #overview display:grid rule.
- Light appearance: soft pastel blue/yellow-led KPI surfaces and varied pastel reporting panels; the workspace canvas remains pure white. Green/periwinkle are secondary low-saturation accents.
- Dark appearance: the canvas and panels stay literal black with restrained blue/yellow edge indicators.
- Keep the navy sidebar/logo and blue/yellow navigation accents unchanged in both themes.
- Keep Appearance, Accessibility, Airtable Architecture and Source Quality under Settings & Data. Airtable inventory numbers remain in the dedicated Architecture tab; no duplicate Overview metrics are shown in Settings.
- No changes to fictional records, reporting calculations, dashboard routes, account permissions or Airtable connectivity.

Validation: node tests/v312-pastels.cjs plus existing V3.9, V3.10, V3.11 and Settings browser suites.
