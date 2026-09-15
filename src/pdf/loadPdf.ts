import * as pdfjs from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

export interface LoadedPdf {
  documentId: string;
  pageCount: number;
  getPageCanvas: (pageIndex: number, scale: number) => Promise<HTMLCanvasElement>;
}

export async function loadPdfFromUrl(url: string, documentId = url): Promise<LoadedPdf> {
  const doc = await pdfjs.getDocument(url).promise;

  return {
    documentId,
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
  };
}
