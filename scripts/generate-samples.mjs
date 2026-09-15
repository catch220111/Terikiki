#!/usr/bin/env node
// Generates local demo assets for Terikiki.
// Copies the pdf.js worker and writes a 3-page lecture PDF plus two handwritten-note SVGs.
// Idempotent, network-free, Node built-ins only.

import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');
const pdfjsDir = join(publicDir, 'pdfjs');
const samplesDir = join(publicDir, 'samples');

for (const dir of [publicDir, pdfjsDir, samplesDir]) {
  mkdirSync(dir, { recursive: true });
}

const workerSrc = join(root, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs');
const workerDest = join(pdfjsDir, 'pdf.worker.min.mjs');
if (existsSync(workerSrc)) {
  copyFileSync(workerSrc, workerDest);
  console.log(`samples: copied pdf.js worker -> ${workerDest}`);
} else {
  console.log('samples: pdfjs-dist not installed yet; skipped worker copy');
}

writeFileSync(join(samplesDir, 'lecture-coupled-notes.pdf'), buildLecturePdf());
writeFileSync(join(samplesDir, 'note-beating.svg'), noteBeatingSvg());
writeFileSync(join(samplesDir, 'note-envelope.svg'), noteEnvelopeSvg());
console.log(`samples: wrote lecture PDF + 2 notes -> ${samplesDir}`);

function buildLecturePdf() {
  const pages = [
    {
      figure: false,
      lines: [
        { t: 'Paper Mechanics 01 — Coupled notes', s: 18, x: 72, y: 720 },
        { t: 'Terikiki sample lecture  (write on paper; keep everything connected)', s: 10, x: 72, y: 698 },
        { t: 'Two oscillators, masses m, springs k, coupling kappa.', s: 12, x: 72, y: 650 },
        { t: 'x1\'\' + w0^2 x1 = (kappa/m)(x2 - x1)', s: 12, x: 90, y: 620 },
        { t: 'x2\'\' + w0^2 x2 = (kappa/m)(x1 - x2)', s: 12, x: 90, y: 598 },
        { t: 'Normal modes: symmetric  (+)  and antisymmetric  (-).', s: 12, x: 72, y: 556 },
        { t: 'The printed page is evidence. The thought lives in handwriting.', s: 11, x: 72, y: 500 },
      ],
    },
    {
      figure: true,
      lines: [
        { t: 'Energy sloshing / beating', s: 18, x: 72, y: 720 },
        { t: 'Start with energy only in x1. It moves into x2 and back.', s: 12, x: 72, y: 688 },
        { t: 'Envelope period = 2 pi / |w+ - w-|', s: 14, x: 100, y: 470 },
        { t: 'The coupling does not create energy; it only moves it.', s: 12, x: 72, y: 360 },
        { t: 'Box this derivation. Ask EXPLAIN if the minus sign feels cheap.', s: 11, x: 72, y: 320 },
      ],
    },
    {
      figure: false,
      lines: [
        { t: 'Practice', s: 18, x: 72, y: 720 },
        { t: '1. Mark ? anywhere the derivation feels thin.', s: 12, x: 72, y: 670 },
        { t: '2. Box the envelope formula on page 2.', s: 12, x: 72, y: 646 },
        { t: '3. Write EXPLAIN beside the antisymmetric mode.', s: 12, x: 72, y: 622 },
        { t: '4. How do two sheets of paper stay coupled without a spring?', s: 12, x: 72, y: 598 },
        { t: 'Pin your notes to a page or a region. Never let a matcher commit for you.', s: 11, x: 72, y: 540 },
      ],
    },
  ];

  const fontObj = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>'];
  const pageRefs = pages.map((_, i) => `${3 + i * 2} 0 R`).join(' ');
  objects.push(`<< /Type /Pages /Kids [${pageRefs}] /Count ${pages.length} >>`);

  for (const page of pages) {
    const contents = pageStream(page.lines, page.figure);
    const pageIndex = objects.length + 1;
    const contentsIndex = pageIndex + 1;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${3 + pages.length * 2} 0 R >> >> /Contents ${contentsIndex} 0 R >>`,
    );
    objects.push(contents);
  }
  objects.push(fontObj);

  let body = '%PDF-1.4\n';
  const offsets = [];
  objects.forEach((obj, i) => {
    offsets.push(body.length);
    body += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefStart = body.length;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    xref += `${String(off).padStart(10, '0')} 00000 n \n`;
  }
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return Buffer.from(body + xref + trailer, 'latin1');
}

function pageStream(lines, figure) {
  const ops = ['BT', '/F1 12 Tf'];
  for (const line of lines) {
    ops.push(`/F1 ${line.s} Tf`, `1 0 0 1 ${line.x} ${line.y} Tm`, `(${pdfEscape(line.t)}) Tj`);
  }
  ops.push('ET');
  if (figure) {
    ops.push('0.90 0.84 0.72 rg', '72 400 468 150 re f', '0.45 0.18 0.12 RG', '1.2 w', '72 400 468 150 re S');
  }
  const stream = ops.join('\n');
  return `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
}

function pdfEscape(text) {
  return text.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
}

function noteBeatingSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
  <rect width="640" height="420" fill="#f6edd6"/>
  <g stroke="#d7c7a4" stroke-width="1">
    ${Array.from({ length: 12 }, (_, i) => `<line x1="40" y1="${70 + i * 26}" x2="600" y2="${70 + i * 26}"/>`).join('')}
  </g>
  <line x1="88" y1="20" x2="88" y2="400" stroke="#c23b22" stroke-opacity="0.35" stroke-width="2"/>
  <text x="108" y="56" font-family="Georgia, serif" font-size="22" fill="#1c1712">why beating only when w+ ~ w- ?</text>
  <path d="M110 96 C160 80, 220 120, 280 100 S390 70, 470 110" fill="none" stroke="#1c1712" stroke-width="2.2"/>
  <path d="M110 150 C200 140, 260 180, 400 155 S540 130, 580 170" fill="none" stroke="#1c1712" stroke-width="2"/>
  <text x="500" y="88" font-family="Georgia, serif" font-size="48" fill="#c23b22">?</text>
  <text x="108" y="250" font-family="Georgia, serif" font-size="16" fill="#27563b">page 2  — pin me, don't auto-commit</text>
</svg>
`;
}

function noteEnvelopeSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
  <rect width="640" height="420" fill="#f4e6c8"/>
  <g stroke="#d7c7a4" stroke-width="1">
    ${Array.from({ length: 12 }, (_, i) => `<line x1="36" y1="${64 + i * 26}" x2="604" y2="${64 + i * 26}"/>`).join('')}
  </g>
  <rect x="120" y="90" width="380" height="90" fill="none" stroke="#c23b22" stroke-width="3"/>
  <text x="140" y="145" font-family="Georgia, serif" font-size="20" fill="#1c1712">T = 2pi / |w+ - w-|</text>
  <text x="140" y="230" font-family="Georgia, serif" font-size="22" fill="#c23b22">EXPLAIN the coupling term</text>
  <path d="M80 280 C140 250, 220 310, 300 270 S430 240, 520 300" fill="none" stroke="#1c1712" stroke-width="2.1"/>
  <text x="80" y="360" font-family="Georgia, serif" font-size="14" fill="#24356b">region on page 2 · box + EXPLAIN</text>
</svg>
`;
}
