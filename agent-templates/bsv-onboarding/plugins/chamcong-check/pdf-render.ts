/**
 * Rasterise a PDF's pages to PNG buffers with mupdf (WASM). The reception forms
 * in column S are scanned, image-only PDFs (no text layer), and the container
 * has no system PDF tooling (poppler/ghostscript), so we render in-process and
 * feed the pages to the vision model.
 *
 * mupdf ships its own wasm; the plugin bundle vendors node_modules/mupdf so the
 * `import` + wasm resolve at runtime inside the container.
 *
 * mupdf is imported LAZILY (dynamic import inside the async function): the
 * package initialises its wasm with top-level await, which the plugin module
 * loader rejects if it sits in the static import graph. Deferring the import to
 * the first render keeps plugin load itself TLA-free.
 */

// Long-side pixels at a typical A4/form page ≈ page-points × scale. The vision
// model caps images at 2048px/side, so ~4.5× keeps dense form text legible
// without triggering a downscale.
const RENDER_SCALE = 4.5;
// Reception forms are 1–2 pages; cap to bound vision cost on odd large PDFs.
const MAX_PAGES = 4;

const VALID_ROTATIONS = new Set([0, 90, 180, 270]);

export interface RenderOptions {
  maxPages?: number;
  scale?:    number;
  /** Degrees to rotate CLOCKWISE so the page reads upright (the scanned forms
   *  are photographed at arbitrary orientations). 0/90/180/270. */
  rotateCw?: number;
}

/**
 * Render up to `maxPages` pages of a PDF to PNG byte buffers (one per page),
 * optionally rotated `rotateCw` degrees clockwise to correct a sideways scan.
 *
 * @usedBy {plugins/chamcong-check/index.ts} → chamcong_check_phieu — turns the col-S PDF into images for the vision read
 */
export async function renderPdfToPngs(pdf: Uint8Array, opts: RenderOptions = {}): Promise<Uint8Array[]> {
  const { maxPages = MAX_PAGES, scale = RENDER_SCALE, rotateCw = 0 } = opts;
  const mupdf = await import('mupdf');
  const doc = mupdf.Document.openDocument(pdf, 'application/pdf');
  const total = Math.min(doc.countPages(), maxPages);
  // mupdf's Matrix.rotate is counter-clockwise; convert the requested clockwise
  // upright correction to the equivalent CCW angle.
  const ccw = (360 - (((rotateCw % 360) + 360) % 360)) % 360;
  const matrix = mupdf.Matrix.concat(mupdf.Matrix.scale(scale, scale), mupdf.Matrix.rotate(ccw));
  const out: Uint8Array[] = [];
  for (let i = 0; i < total; i++) {
    const page = doc.loadPage(i);
    const pix = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB);
    out.push(pix.asPNG());
  }
  return out;
}

/**
 * Parse the orientation-detection reply into a clockwise upright rotation.
 * Accepts a `{"rotate": 0|90|180|270}` object embedded anywhere in the text;
 * anything else (missing, non-multiple-of-90, malformed) falls back to 0. Pure.
 *
 * @usedBy {plugins/chamcong-check/index.ts} → chamcong_check_phieu — turns the model's orientation guess into a rotation
 */
export function parseRotationCw(text: string): 0 | 90 | 180 | 270 {
  const raw = text ?? '';
  const start = raw.indexOf('{'), end = raw.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      const r = Number((JSON.parse(raw.slice(start, end + 1)) as { rotate?: unknown }).rotate);
      if (VALID_ROTATIONS.has(r)) return r as 0 | 90 | 180 | 270;
    } catch {
      // malformed → default below
    }
  }
  return 0;
}
