# AI Models — Chọn "bộ não" AI cho agent

> **AI Model** là mô hình AI mà agent dùng để suy nghĩ và trả lời. Bạn có thể để platform tự chọn (trả bằng credit), hoặc **dùng tài khoản AI riêng** của mình.

## Hai cách cấp nguồn AI

- **ClawExpert (trả theo lượt bằng credit)** — platform tự chọn và chạy model giúp bạn, không cần API key. Mặc định là **Auto (tối ưu chi phí)** (hiện là chip **Toc**): tự chọn model phù hợp cho từng yêu cầu.
- **API Key riêng (BYOK)** — kết nối tài khoản của bạn ở một nhà cung cấp AI và dùng model đó trực tiếp; bạn trả tiền thẳng cho nhà cung cấp (không trừ credit platform).

## Nhà cung cấp hỗ trợ

ChatGPT Plus (đăng nhập OAuth), Anthropic, OpenAI, Google, OpenRouter, LiteLLM, Groq, Cerebras, Fireworks, Together, NVIDIA, Hugging Face, xAI (Grok), Mistral, DeepSeek, Moonshot (Kimi), Qwen, MiniMax — và có thể **thêm endpoint tuỳ chỉnh** (OpenAI-compatible).

Model ví dụ: Claude Opus / Sonnet / Haiku; GPT-5 / Mini / Nano; Gemini Pro / Flash; Grok; Llama; DeepSeek; Kimi; Mistral; Qwen.

## Nên chọn model nào

- **Chất lượng cao** (việc khó): chọn model flagship (vd Claude Opus, GPT-5, Gemini Pro).
- **Nhanh / tiết kiệm**: chọn model "Fast/Affordable" (vd Haiku, GPT-5 Mini/Nano, Gemini Flash) — hoặc cứ để **Auto** cho platform cân bằng giúp.
- **Muốn dùng gói ChatGPT Plus sẵn có**: kết nối ChatGPT Plus để tiết kiệm chi phí API.

## Cần gì trước

- Một **instance đã tạo** để kết nối provider (chưa có sẽ thấy "Tạo instance để kết nối AI provider"). Tạo instance cần gói trả phí.
- Đường **ClawExpert** cần có **credit** (hết credit thì AI không chạy cho tới khi nạp thêm).

## Cách 1 — Kết nối tài khoản AI của bạn (Cài đặt → AI Models)

1. Mở **Cài đặt** → tab **AI Models**.
2. Tìm/lọc nhà cung cấp (All / AI Provider / AI Gateway / Fast Inference / Open Models) → mở thẻ provider.
3. Làm theo "How to get a token", dán khoá vào **API KEY** → bấm **Kết nối**.
   - Riêng **ChatGPT Plus**: bấm **Connect** → mở link đăng nhập → nhập mã → duyệt trong ChatGPT (OAuth, không cần key).
4. Đổi khoá sau này: **Thay key**; gỡ: **Ngắt kết nối**. (Kết nối lưu ở cấp instance; khoá được lưu mã hoá.)

## Cách 2 — Chọn model cho từng agent

1. Mở cấu hình agent (tạo mới hoặc sửa) → tìm mục **Nhà cung cấp model (Model Providers)**.
2. Chip đầu tiên **Toc** là **Auto** (mặc định, luôn có). Các chip khác hiện theo provider bạn đã kết nối.
3. Bấm chip để đổi — agent sẽ dùng model tương ứng.

## Lúc tạo instance (deploy)

- Ở bước "Bạn muốn trả phí AI bằng cách nào?", chọn **ClawExpert** (Auto, dùng credit) hoặc **API Key riêng** (chọn Provider + Model + nhập key).

## Lưu ý cần thiết

- Mặc định là **Auto (tối ưu chi phí)** — nếu khách không đổi gì thì đang chạy chế độ tự chọn model của platform.
- Một số model bị **khoá theo gói** (hiện xám "upgrade plan" / "Yêu cầu gói …") → cần nâng gói mới chọn được.
- Danh sách model của provider chỉ tải khi **instance đang chạy**.

## Gợi ý cho agent khi hướng dẫn

- Hỏi khách ưu tiên gì (chất lượng / tốc độ / tiết kiệm) để gợi ý model.
- Nếu khách muốn tiết kiệm chi phí API và đã có ChatGPT Plus, gợi ý kết nối ChatGPT Plus.
- Nhắc: đổi model là ở **từng agent**; kết nối provider là ở **Cài đặt → AI Models**.
