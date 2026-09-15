# Terikiki

Paper-first AI study tool: write on paper, keep everything connected.

## Stack

Vite 8 + React 19 + TypeScript + `pdfjs-dist`. Node `>=22.12.0`.

## Stage 1 (current)

Document-matrix shell:

- Pan / zoom canvas with PDF primary axis and H/V orientation flip
- Per-page material stubs (handwriting, transcription, questions, AI)
- Origin/type layer toggles
- Shift+click multi-select chip strip (AI context placeholder)
- `MatchingService` + `ThinkingTrail` interface stubs only

```bash
npm install
npm run dev
```

Dev server: `http://127.0.0.1:5174`
