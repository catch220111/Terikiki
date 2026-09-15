# Terikiki

**Write on paper. Keep everything connected.**

Terikiki is a paper-first study tool. Handwriting is the primary intellectual artifact. The printed PDF is evidence hanging on a desk matrix — not a chatbot with a file attached.

## Stack

Vite 8 + React 19 + TypeScript + `pdfjs-dist`. Node `>=22.12.0`.

## Chrome (this cut)

The shell is a **PDF-editor / notebook reader** on VL v1 tokens (`src/ui/lock.ts`): `--bg --surface --border --text --muted --accent --hand --ai --pdf --danger`. Sans chrome and wordmark; script only on command-mark glyphs. Cards stay flat 8–12px. Handwriting is largest (`--hand`); PDF pages are stiff (`--pdf`); AI cards stay quieter (`--ai`). Origins are token color + scale, not craft-desk texture and not a marketing masthead.

VL v1.1 implementable cut (`src/ui/lock.ts`):

- Keep v1 tokens; no craft regress.
- Dual surface: tool chrome vs **light page paper** (`--stage`).
- Thumbnail rail
- **Compact** zoom/fit bar (− / % / + / Fit)
- **Segmented annotation strip**
- Trail as **collapsed inspector drawer**
- Ask stays Pull/Tuck flat sheet
- Handwriting size primacy unchanged

Soft residuals stay backlog. Stage 1–4 behavior locks hold.

The chrome is tool-forward: dense grouped toolbar (Open PDF / Import notes / layers / orientation / Print / Detect marks / Trail / Pull Ask). Manual pin is the active tool on the segmented strip, not a form on every note. The matrix stays the spatial center.

## Stage 4

Printable sheet, thin thinking trail, and command-mark stubs.

**Stage 4 locks** (`src/export/lock.ts`, `src/trail/lock.ts`, `src/marks/lock.ts`):

1. **One print sheet** — source excerpt + handwritten working margin on a single sheet. **Send to printer** prints the preview **iframe**, never `window.open`. If a thinking trail rides the sheet, it is a **thin ordered strip** with **(AI)** vs **(ink)** labels. Command marks confirm only in the app UI — the sheet never auto-executes unconfirmed marks.
2. **Thinking trail** — append-only events keyed to card ids (`first_note`, `question`, `pdf_evidence`, `correction`, `ai_explanation`, `latest_understanding`). AI beats are labeled **AI**; student writing is **ink**. Lightweight history, not a VCS.
3. **Command marks** — Detect → show for confirmation → Confirm or Dismiss only (desk inbox). Vocabulary: `?` unresolved question, `*` important, box → study card, circle → verify equation, arrow → relationship/anchor, `R` review, `EXPLAIN` request explanation. Confirming never silent-fires Ask, pins, or study cards. Print shows confirmed glyphs only.

## Live preview

**https://catch220111.github.io/Terikiki/**

Pushes to `main` run [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml): `npm run build` (Vite `base` `/Terikiki/`, samples in `public/samples`) then `actions/deploy-pages`. PDF and note URLs use that base, so they stay same-origin on the project site.

After merge: **Settings → Pages → Source: GitHub Actions**. Re-run the workflow if the first deploy ran before that was set.

Local: `http://127.0.0.1:5174/Terikiki/` (`npm run dev`) or `http://127.0.0.1:4173/Terikiki/` (`npm run preview`).

## Demo

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5174/Terikiki/`.

The editor boots a 3-page sample lecture (*Paper Mechanics 01 — Coupled notes*) and two unpinned handwritten notes. The toolbar shows the document title; the left thumbnail rail lists p1–p3. Match slips are **pending**. Marks wait for **Detect marks** (Trail opens as a drawer). Click a page thumb to jump in the matrix (that does not gather Ask). Pin with **Pin page** / **Pin region** in the segmented strip after selecting a note — not with per-card pin buttons.

### Print desk / trail / detect → confirm

1. Pan the matrix. On *Why beating?*, **Accept** the pending stub so the note hangs in that page’s margin.
2. **Detect marks**. The trail inbox lists proposals (`?`, box, `EXPLAIN`, …) with meanings. Nothing is committed yet.
3. **Confirm** `?` on *Why beating?*. **Dismiss** or **Confirm** `EXPLAIN` on *Box the envelope*. Confirmed glyphs appear on the note in script; Ask does not open; no pin is written.
4. Click the hanging note and its printed page. **Pull Ask**, ask a question, optionally **Pin answer on desk**. The trail shows student ink beats, then an **AI** explanation — separately labeled.
5. **Print**. One sheet: printed excerpt + handwritten margin. The thinking trail rides the sheet as a thin ordered strip (**ink** vs **AI**). Unconfirmed marks do not appear or execute — confirm them in the trail inbox first. **Send to printer** prints the iframe. Close / Escape.

### Stage 3 Ask (unchanged)

Gather chips → **Pull Ask** → ask → citation stamps jump back. Tuck / Escape. Ask context is exactly the live SelectionSet.

### Stage 2 import → suggest → accept / reject / correct → manual pin (unchanged)

Pending slips stay **not pinned** until Accept / Correct / pin via the segmented strip (Pin page or Pin region). Reject writes nothing.

## Architecture

| Area | Where |
| --- | --- |
| Domain types (cards, layers, anchors, selection, matching, trail, marks, citations) | `src/types/domain.ts` |
| Pure desk reducer | `src/engine/deskState.ts` |
| Anchor helpers (page/region, duplicates, hang slot) | `src/engine/anchors.ts` |
| MatchingService boundary + stub | `src/matching/service.ts`, `src/matching/stubMatcher.ts` |
| Stage 2 anchor lock (pending off-graph) | `src/matching/lock.ts` |
| Note image import | `src/notes/importImage.ts` |
| Pluggable AI + selection snapshots | `src/ai/client.ts`, `src/ai/context.ts`, `src/ai/mockClient.ts` |
| Stage 3 Ask lock (live chips, in-gathering cites, tucked overlay) | `src/ai/lock.ts` |
| Command-mark detector + confirm lock | `src/marks/detectMarks.ts`, `src/marks/lock.ts` |
| Thinking trail order + AI/ink lock | `src/trail/events.ts`, `src/trail/lock.ts` |
| Stage 4 print lock (one sheet, iframe not popup, AI/ink labeled) | `src/export/lock.ts`, `src/export/printSheet.ts` |
| pdf.js loader | `src/pdf/loadPdf.ts` |
| VL v1 + PDF-editor shell lock (tokens, no craft desk, handwriting size, toolbar + page strip, Ask overlay) | `src/ui/lock.ts`, `src/styles/desk.css` |
| Desk UI | `src/ui/*`, `src/styles/desk.css` |

Sample assets are generated by `npm run samples` (`scripts/generate-samples.mjs`) into `public/samples` (gitignored).

## Checks

```bash
npm run typecheck
npm test
npm run build
```
