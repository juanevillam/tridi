// Lazy-loaded browser PDF page rasterizer for scanned / outlined-font P&ID blueprints.
// Dynamically imported only when local PDF text extraction finds 0 ISA-5.1 tags,
// keeping First Paint on #/ and vector DXF/PDF flows at 0 extra bytes.

let pdfjsPromise = null;

async function loadPdfJs() {
  if (!pdfjsPromise) {
    pdfjsPromise = Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ]).then(([pdfjs, workerMod]) => {
      pdfjs.GlobalWorkerOptions.workerSrc = workerMod.default;
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

/**
 * Renders a single page of a PDF (Uint8Array / ArrayBuffer) onto an offscreen canvas
 * and returns a JPEG data URL (<= maxDim on the longest edge) + Blob preview URL.
 */
export async function renderPdfPageToImage(
  pdfBytes,
  { pageNumber = 1, maxDim = 1600, quality = 0.86 } = {},
) {
  if (typeof document === 'undefined') {
    throw new Error('Canvas rendering requires a browser environment.');
  }
  const pdfjs = await loadPdfJs();
  // Copy bytes so transferring to the PDF.js worker never detaches the caller's buffer.
  const copy = pdfBytes instanceof Uint8Array ? pdfBytes.slice() : new Uint8Array(pdfBytes).slice();
  const loadingTask = pdfjs.getDocument({ data: copy });
  const pdf = await loadingTask.promise;

  try {
    const pageCount = Math.max(1, pdf.numPages || 1);
    const safePage = Math.min(pageCount, Math.max(1, Math.round(Number(pageNumber) || 1)));
    const page = await pdf.getPage(safePage);

    try {
      const baseViewport = page.getViewport({ scale: 1 });
      const longest = Math.max(baseViewport.width, baseViewport.height, 1);
      // Scale up small drawings for crisp ISA tag legibility, while capping at maxDim (1600 px)
      // to keep Vision payload size and OpenRouter token cost tightly bounded (~$0.0085/page).
      const scale = Math.min(2.5, maxDim / longest);
      const viewport = page.getViewport({ scale });

      const width = Math.max(1, Math.round(viewport.width));
      const height = Math.max(1, Math.round(viewport.height));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: false });
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      await page.render({ canvasContext: ctx, viewport }).promise;

      const imageDataUrl = canvas.toDataURL('image/jpeg', quality);
      let previewImageUrl = imageDataUrl;
      if (typeof URL !== 'undefined' && typeof canvas.toBlob === 'function') {
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
        if (blob) previewImageUrl = URL.createObjectURL(blob);
      }

      // Release backing store immediately after export.
      canvas.width = 0;
      canvas.height = 0;

      return {
        imageDataUrl,
        previewImageUrl,
        pageNumber: safePage,
        pageCount,
        width,
        height,
      };
    } finally {
      page.cleanup?.();
    }
  } finally {
    await pdf.destroy();
  }
}
