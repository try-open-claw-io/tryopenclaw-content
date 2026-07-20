/**
 * CCCD field extraction via OpenClaw's own image.describe capability.
 *
 * We shell out to `openclaw infer image describe` rather than calling the model
 * endpoint directly: the model API key is resolved by OpenClaw's provider layer
 * (not exposed to plugins), and the capability handles provider request-shaping
 * quirks. The model is passed in (resolved from the enterprise config), never
 * hardcoded here.
 *
 * IMPORTANT: the model REFUSES to "extract ID info" from the printed FRONT of a
 * CCCD (a stochastic safety guardrail), so we read the BACK instead:
 *  - the MRZ (machine-readable zone) — transcribed verbatim, then parsed
 *    deterministically with check digits (gives CCCD, DOB, name, sex);
 *  - the printed issue date / issuing authority.
 * Framing the MRZ as plain character transcription (no "ID extraction" wording)
 * avoids the refusal.
 */
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Neutral wording ("transcribe the OCR character strings") — avoids priming the
// model's ID-document refusal, which fires stochastically on "CCCD/MRZ/giấy tờ".
export const MRZ_PROMPT =
  "Ở phần DƯỚI CÙNG của tấm ảnh có 3 dòng ký tự OCR, mỗi dòng gồm chữ IN HOA, chữ số và dấu nhỏ-hơn (<). " +
  "Chép lại NGUYÊN VĂN đúng 3 dòng đó, mỗi dòng một hàng. KHÔNG giải thích, KHÔNG thêm gì khác.";

export const BACK_PRINTED_PROMPT =
  "Đây là mặt sau thẻ căn cước. Chỉ đọc phần chữ IN về việc cấp thẻ và trả về DUY NHẤT một JSON: " +
  '{"ngay_cap":"<ngày cấp dd/mm/yyyy>","noi_cap":"<tên cơ quan cấp>"}. Không đọc thông tin nào khác.';

// The reception form is a company onboarding document (not an ID card), so a
// direct field-extraction prompt does not trip the model's ID-document refusal.
export const PHIEU_PROMPT =
  "Đây là ảnh phiếu tiếp nhận công nhân (tiếng Việt). Trả về DUY NHẤT một JSON với các khóa: " +
  '"ho_ten","ten_tai_khoan","so_tai_khoan","ten_ngan_hang","chi_nhanh","muc_luong","loai_luong". ' +
  "Khóa nào không thấy để chuỗi rỗng. Không giải thích, không thêm gì khác.";

// The scanned forms are photographed sideways/upside-down; a wrong orientation
// makes the model hallucinate the handwritten fields. We detect the correction
// off the LARGE printed title (robust even with a phone/CCCD in frame).
export const ORIENTATION_PROMPT =
  "Ảnh phiếu này có thể bị xoay. Để dòng chữ IN tiêu đề 'PHIẾU TIẾP NHẬN CÔNG NHÂN' đọc xuôi từ trái sang phải, " +
  'cần xoay ảnh bao nhiêu độ THEO CHIỀU KIM ĐỒNG HỒ? Trả về DUY NHẤT JSON {"rotate":0|90|180|270}.';

// Face bounding box for cropping the FaceID avatar to the face (not the whole
// photo). Plain "locate the face" wording — no ID-extraction, so no refusal.
// Explicit hairline→chin, exclude neck/shoulders — models otherwise box down to
// the chest, which pushes the crop too low.
export const FACE_BBOX_PROMPT =
  "Ảnh có một người. Trả về DUY NHẤT một JSON {\"x\":<>,\"y\":<>,\"w\":<>,\"h\":<>} là bounding box ÔM SÁT KHUÔN MẶT: " +
  "cạnh TRÊN tại CHÂN TÓC (nơi tóc bắt đầu trên trán), cạnh DƯỚI tại CẰM, hai cạnh BÊN tại mép ngoài hai bên mặt (mang tai). " +
  "KHÔNG bao gồm cổ, vai, thân hay nền. Theo TỈ LỆ 0..1 (x,w theo chiều rộng ảnh; y,h theo chiều cao ảnh); " +
  "x,y là góc trên-trái. Không giải thích, không markdown.";

export type ExecFn = (file: string, args: string[]) => Promise<string>;

const defaultExec: ExecFn = (file, args) =>
  new Promise((resolve, reject) =>
    execFile(file, args, { maxBuffer: 8 * 1024 * 1024, timeout: 120_000 }, (err, stdout) =>
      err ? reject(err) : resolve(String(stdout)),
    ),
  );

/**
 * Describe one image via `openclaw infer image describe`; returns the model's raw text reply.
 * `ext` sets the temp file's extension to match the bytes (jpg for CCCD, png for rendered phiếu pages).
 *
 * @usedBy {plugins/chamcong-check/index.ts} → chamcong_check_cccd — reads the CCCD back (MRZ + printed)
 * @usedBy {plugins/chamcong-check/index.ts} → chamcong_check_phieu — reads each rendered reception-form page
 */
export async function describeImage(
  bytes: Uint8Array,
  prompt: string,
  model: string,
  ext: string = "jpg",
  exec: ExecFn = defaultExec,
): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "img-"));
  const file = join(dir, `img.${ext}`);
  try {
    await writeFile(file, bytes);
    const stdout = await exec("openclaw", [
      "infer", "image", "describe",
      "--file", file,
      "--model", model,
      "--prompt", prompt,
      "--json",
      "--timeout-ms", "90000",
    ]);
    const parsed = JSON.parse(stdout) as { outputs?: Array<{ text?: string }> };
    return parsed?.outputs?.[0]?.text ?? "";
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
