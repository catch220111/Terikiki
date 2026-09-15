import * as pdfjs from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { PDFDocumentProxy } from 'pdfjs-dist';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

export interface LoadedPdf {
  documentId: string;
  title: string;
  pageCount: number;
  getPageCanvas: (pageIndex: number, scale: number) => Promise<HTMLCanvasElement>;
  getPageText: (pageIndex: number) => Promise<string>;
}

function wrapDocument(doc: PDFDocumentProxy, documentId: string, title: string): LoadedPdf {
  return {
    documentId,
    title,
    pageCount: doc.numPages,
    async getPageCanvas(pageIndex: number, scale: number) {
      const page = await doc.getPage(pageIndex + 1);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('2D canvas unavailable');
      await page.render({ canvasContext: ctx, viewport, canvas }).promise;
      return canvas;
    },
    async getPageText(pageIndex: number) {
      const page = await doc.getPage(pageIndex + 1);
      const content = await page.getTextContent();
      return content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
    },
  };
}

export async function loadPdfFromUrl(url: string, documentId = url, title?: string): Promise<LoadedPdf> {
  const doc = await pdfjs.getDocument({ url }).promise;
  return wrapDocument(doc, documentId, title ?? documentId);
}

export async function loadPdfFromFile(file: File): Promise<LoadedPdf> {
  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  return wrapDocument(doc, `file:${file.name}`, file.name.replace(/\.pdf$/i, ''));
}
