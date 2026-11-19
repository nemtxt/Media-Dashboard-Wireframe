# Media Dashboard — interactive wireframe v1.0

A responsive, entirely client-side HTML/CSS/JavaScript wireframe for the Media Dashboard Claude Artifact, based on the user-provided Airtable architecture summary (not a live API connection).

## Run it
Open `index.html` in Chrome, Edge, or Safari. No installations, accounts, APIs, or paid services are required. For a one-file version, open `media_dashboard_wireframe.html` from the delivery package.

## Navigation plan

1. Overview — metrics, score, trends, account comparison, deadlines and team summary
2. Content Pipeline — Kanban and data table, statuses, content mix and deadlines
3. Performance — Organic Posts and Social Pages subtabs, 24H/7D indicators
4. Paid Ads — campaign efficiency, spending, sales and ROAS
5. Website & SEO — traffic, pages and keywords
6. Strategy & Ops — KRA/KPI, Initiatives, Requests & SOE subtabs
7. Calendar & Team — 3-month calendar, agenda, team workload and deadline tracker
8. Source Map (secondary utility) — Airtable table links and data-quality safeguards

## Interaction inventory
- Side navigation and subtabs change screens without reloading.
- Global filters: account, platform; global text search of tasks/people.
- Content Kanban/table toggle; 3-month calendar navigation and day selection.
- Clickable work items and people show read-only detail drawers.
- Calendar and workload indicators derive from one consistent fictional task set.
- Responsive layouts for desktop/tablet/mobile; mobile navigation drawer and keyboard dismissal.
- Reduced-motion accessibility support; no external frameworks or fonts required.

## Data policy / Caveats
- All people, tasks, dates, scores, ads, charts, page metrics and keyword values are **fictional** for visualization purposes.
- Base table names, record volumes, page count and relationships originate from the user's Claude-generated Airtable summary, not a live Airtable query in this session.
- Source counts (e.g., 596 creative tracker items, 413 organic posts) are provided architecture-level counts and are not tied to the small sample task array.
- No Airtable access tokens, create/update/delete endpoints, or remote requests exist in this prototype.
- Demo date is 2026-11-19; three months initially visible are November 2026, December 2026 and January 2027.

## Later integration plan (read-only)
1. Obtain an authorized, scoped Airtable read connection in the Claude environment.
2. Load table/field schema, map stable IDs and define the canonical work item model.
3. Fetch source records read-only and compute deadline, owner, status and workload views client-side.
4. Separate original Airtable scores from validated derived calculations; label every derived figure.
5. Record data-quality issues: unknown names, missing dates/owners, malformed SEO numbers, formula logic, legacy templates.
6. Add explicit refreshed-at timestamps, empty/error states, and explain data source per metric.
7. Test access scope and performance against real volumes before enabling refresh.

## Source-to-section sketch
- Content: Creatives Content Tracker, MadSerye Productions, Multimedia artist assistance.
- Organic: Organic Performance Tracker, 24H Performance Tracker, 7Days Performance Tracker.
- Social: Soc Med Page Performance, Monthly Marketing Metrics, Scoring BenchMark.
- Ads: Ad Campaigns, Ad Campaigns Results (old template tables excluded from live reporting).
- Website: MH Website Metrics, Page and Screen, Traffic Acquisition, SEO Keywords Monitoring.
- Strategy: KRA -> KPI -> Action Plan, Chiefs' Initiatives, Media Team SOE.
- Calendar & Team: cross-table derived schedule of valid due/posting dates and assignee identifiers.

No modification of the user's Airtable data is implemented or intended.
