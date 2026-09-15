#!/usr/bin/env node
// Generates local dev sample assets for Terikiki. This is the setup file
// referenced by the `samples` npm script (and, transitively, `dev`/`build`).
//
// It:
//   - copies the bundled pdf.js worker into public/pdfjs (so the app can use a
//     local worker instead of a CDN), and
//   - writes a tiny, valid single-page sample PDF into public/samples so the
//     matrix can be exercised fully offline.
//
// It is idempotent, network-free, and only uses Node built-ins, so it is safe
// to run repeatedly from `npm run dev` / `npm run build` in any environment.

import { existsSync, mkdirSync, copyFileSync, writeFileSync } from 'node:fs';
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

const samplePdf = join(samplesDir, 'sample.pdf');
writeFileSync(samplePdf, buildSamplePdf());
console.log(`samples: wrote sample PDF -> ${samplePdf}`);

function buildSamplePdf() {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    contentStream('terikiki sample PDF'),
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

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

function contentStream(text) {
  const stream = `BT /F1 24 Tf 72 700 Td (${text}) Tj ET`;
  return `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
}
