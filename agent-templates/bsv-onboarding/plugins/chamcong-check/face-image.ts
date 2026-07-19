/**
 * Face-image preprocessing for HANET registration: decode (incl. iPhone HEIC),
 * auto-orient by EXIF, detect the face via an INJECTED detector (the instance's
 * vision model), and crop a padded square centred on the face so the registered
 * avatar is focused on the face (not the whole photo).
 *
 * jimp (pure-JS) is bundled into index.js by Bun.build (it's a devDependency so
 * compile.ts doesn't externalize it). HEIC is not decoded — real sheet col-T
 * images are JPEG; a rare HEIC errors clearly so the operator re-uploads JPG.
 * The pure helpers are unit-tested; prepareFaceImage exercises jimp for real.
 */
import { Jimp } from "jimp";

export interface FaceBox {
  x: number; y: number; w: number; h: number; // fractions 0..1, (x,y) = top-left
}

// HEIF/HEIC major brands seen after the "ftyp" box.
const HEIC_BRANDS = /^(hei|hev|mif1|msf1)/;
// Square side ≈ max(faceWidth, faceHeight) × this. With the tight hairline→chin box
// from FACE_BBOX_PROMPT, sizing off the box gives a face-filled avatar. Tuned on real photos.
const DEFAULT_PAD = 1.35;
// Shift the crop UP by faceHeight × this → more head/hair, less neck/collar below.
const FACE_UP = 0.12;

/** True when the bytes are an HEIF/HEIC image (iPhone default). Pure. */
export function isHeic(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false;
  const at = (a: number, b: number) => String.fromCharCode(...bytes.slice(a, b));
  return at(4, 8) === "ftyp" && HEIC_BRANDS.test(at(8, 12));
}

/**
 * Parse a vision model's face bounding box from its text output. Tolerates prose/
 * markdown fences, x/y/w/h or left/top/width/height keys, and 0-100 percentages.
 * Returns null when unparseable. Pure.
 *
 * @usedBy {plugins/chamcong-check/index.ts} → chamcong_register_faceid — turns the vision reply into a box
 */
export function parseFaceBox(text: string): FaceBox | null {
  const match = (text ?? "").match(/\{[^{}]*\}/);
  if (!match) return null;
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(match[0]) as Record<string, unknown>;
  } catch {
    return null;
  }
  const pick = (...keys: string[]): number | undefined => {
    for (const k of keys) {
      const v = obj[k];
      if (typeof v === "number" && Number.isFinite(v)) return v;
    }
    return undefined;
  };
  let x = pick("x", "left"), y = pick("y", "top"), w = pick("w", "width"), h = pick("h", "height");
  if (x === undefined || y === undefined || w === undefined || h === undefined) return null;
  if (Math.max(x, y, w, h) > 1) { x /= 100; y /= 100; w /= 100; h /= 100; } // percentages → fractions
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
  x = clamp01(x); y = clamp01(y); w = clamp01(w); h = clamp01(h);
  if (w <= 0 || h <= 0) return null;
  return { x, y, w, h };
}

/**
 * Compute a SQUARE crop rect (pixels) for the face: sized off the larger of the
 * box's width/height (× pad), centred on the box centre but shifted up so the head
 * stays in frame with less neck below, clamped to the image. Pure.
 *
 * @usedBy {plugins/chamcong-check/face-image.ts} → prepareFaceImage — the crop geometry
 */
export function computeCropSquare(box: FaceBox, imgW: number, imgH: number, pad: number): { left: number; top: number; side: number } {
  const fw = box.w * imgW, fh = box.h * imgH;
  const cx = (box.x + box.w / 2) * imgW;
  const cy = (box.y + box.h / 2) * imgH - fh * FACE_UP;
  let side = Math.round(Math.max(fw, fh) * pad);
  side = Math.min(side, imgW, imgH);
  let left = Math.round(cx - side / 2), top = Math.round(cy - side / 2);
  left = Math.max(0, Math.min(left, imgW - side));
  top = Math.max(0, Math.min(top, imgH - side));
  return { left, top, side };
}

/** Decode JPEG/PNG + auto-orient via EXIF → a jimp image. Errors on HEIC. */
async function loadUpright(bytes: Uint8Array) {
  if (isHeic(bytes)) throw new Error("ảnh HEIC chưa hỗ trợ — hãy dùng JPG/PNG");
  return Jimp.read(Buffer.from(bytes)); // jimp applies EXIF orientation on read
}

/**
 * Prepare a face image for HANET: upright + cropped-to-face JPEG. `detectBox` is
 * injected (the vision model) so this module stays free of the gateway. If no box
 * is detected, falls back to the upright, uncropped JPEG (better than failing).
 *
 * @usedBy {plugins/chamcong-check/index.ts} → chamcong_register_faceid — preps col-T image before register
 */
export async function prepareFaceImage(
  bytes: Uint8Array,
  detectBox: (uprightJpeg: Uint8Array) => Promise<FaceBox | null>,
  pad: number = DEFAULT_PAD,
): Promise<Uint8Array> {
  const img = await loadUpright(bytes);
  const uprightJpeg = new Uint8Array(await img.getBuffer("image/jpeg"));
  const box = await detectBox(uprightJpeg).catch(() => null);
  if (!box) return uprightJpeg;
  const { left, top, side } = computeCropSquare(box, img.bitmap.width, img.bitmap.height, pad);
  img.crop({ x: left, y: top, w: side, h: side });
  return new Uint8Array(await img.getBuffer("image/jpeg"));
}
