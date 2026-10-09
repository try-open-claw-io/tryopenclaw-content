# TOC Guidelines — nội dung hướng dẫn (GUIDE.md)

> Cùng với `SKILL.md`, đây là kiến thức nền bắt buộc cho mọi agent, kể cả subagent và tác vụ theo lịch.
> Dùng bản đầy đủ đã được đưa vào context; không fetch lại ở mỗi lượt. Tài liệu chi tiết được tra khi cần.
> Các khuôn trả lời dưới đây chỉ áp dụng khi hướng dẫn nền tảng hoặc giới thiệu agent, không thay thế
> chuyên môn, persona hay định dạng người dùng yêu cầu cho công việc khác; quy tắc an toàn trong `SKILL.md` vẫn áp dụng.

## Tám tính năng chính & file hướng dẫn

Khi cần liệt kê hay hướng dẫn, hãy LẤY đúng file dưới đây (theo §Nguồn nội dung trong SKILL.md) thay vì đoán:

| Người dùng hỏi về | Đọc file |
|---|---|
| Nền tảng hoạt động thế nào, vì sao "chưa dùng được", instance/gói/credit | [`references/platform-basics.md`](references/platform-basics.md) |
| **Skills** — năng lực đính kèm agent (có gì, cài thế nào) | [`references/skills-catalog.md`](references/skills-catalog.md) + [`references/install-guide.md`](references/install-guide.md) |
| **Connectors** — tích hợp app ngoài để agent thao tác (Gmail, Slack, Notion...) | [`references/connectors-catalog.md`](references/connectors-catalog.md) (mục lục: nhóm/app nào nằm ở `connectors-catalog-<n>.md` nào — lấy mục lục trước rồi lấy đúng phần) + [`references/install-guide.md`](references/install-guide.md) |
| **Channels** — chat với agent qua Telegram/Zalo/Discord/Slack/WhatsApp | [`references/channels-guide.md`](references/channels-guide.md) |
| **Agent Marketplace / tạo Agent** — cài agent dựng sẵn, hoặc tự tạo | [`references/agents-marketplace-guide.md`](references/agents-marketplace-guide.md) — đây là luồng CÀI/TẠO nói chung. Hỏi về **một agent cụ thể** (nó làm được gì, hợp không, dùng sao) — dù đã cài hay mới thấy trên chợ → xem §Agent dựng sẵn bên dưới |
| **Scheduled Tasks** — lên lịch cho agent tự chạy định kỳ | [`references/scheduled-tasks-guide.md`](references/scheduled-tasks-guide.md) |
| **Extension trình duyệt** — agent thao tác trực tiếp trên trình duyệt Chrome của bạn (mở web X để làm Y, điền form, lấy dữ liệu...) | Skill riêng `browser-extension` — làm theo §Extension trình duyệt & Điều khiển máy tính trong SKILL.md |
| **Điều khiển máy tính** — agent đọc/ghi file, chạy lệnh trên máy tính đã ghép nối (platform-admin only) | Skill riêng `desktop-device` — làm theo §Extension trình duyệt & Điều khiển máy tính trong SKILL.md |
| **AI Models** — chọn/đổi model AI, kết nối provider của bạn | [`references/ai-models-guide.md`](references/ai-models-guide.md) |


## Agent dựng sẵn — giới thiệu & hướng dẫn dùng

Bảng trên là **năng lực nền tảng**. Phần này khác tầng: nói về **từng agent cụ thể**.

LẤY đúng **1 file** của agent đang nói tới. **Đừng lấy cả 4** (mỗi file là một cuốn hướng dẫn
dài; lấy thừa chỉ tốn ngữ cảnh mà không dùng tới).

### ⚠️ HAI TẦNG TRẢ LỜI — phân loại câu hỏi TRƯỚC khi mở miệng

**Đọc file KHÔNG có nghĩa là kể lại cả file.** File rất dài; xác định tầng rồi trả lời đúng tầng.

**TẦNG 1 — "là gì / làm được gì / hợp không"**
*"Agent Sales là sao?" · "cái này làm được gì?" · "agent này hợp shop mình không?"*

Trả lời đúng khuôn này, không thêm gì khác:

```
<MỘT câu định vị: agent này làm NGHỀ GÌ cho người dùng>.   ← câu quan trọng nhất

- <việc nó làm — 1 dòng>     (3-5 dòng, mỗi dòng một ý, viết như nói chuyện)

Hợp với: <một câu — ai nên dùng>.

Bạn muốn biết kỹ hơn phần nào?
```

- ✅ "Trợ lý bán hàng đa kênh là nhân viên bán hàng trực Facebook, Zalo và website cho bạn 24/7."
- ❌ "Nói ngắn gọn: …" · "Đây là một agent giúp bạn…" · "Có nhé — …" → rào đón, chưa định vị
- **CẤM** heading, bảng, gạch con, mục kiểu "Ba thứ hay nhất", và mọi thứ thuộc thao tác (tên
  tab, tên nút, số bước, thời gian chờ, giới hạn kỹ thuật).

**Nếu họ tả CÔNG VIỆC thay vì gọi tên agent** (*"tôi bán hàng online thì dùng cái nào?"*) — họ
không biết agent nào tên gì, việc của bạn là gán việc của họ vào agent hợp:

- Có agent khớp → trả lời theo khuôn trên, rồi **một dòng** gợi ý agent còn lại dùng kèm được.
- Không cái nào khớp hẳn → **đừng nói cụt "không có"**; nêu agent gần nhất, nói rõ nó đỡ được
  phần nào, phần nào không.
- **Không bịa năng lực cho khớp.** Thà nói "phần này chưa có agent nào làm" còn hơn hứa sai.

**TẦNG 2 — "chi tiết / làm thế nào / ở đâu"**
*"kể chi tiết đi" · "chốt đơn thế nào?" · "duyệt bài ở đâu?"*

Người dùng đã cài app, giao diện tự chỉ họ bấm gì. Nói **HÀNH VI của agent** — thứ nhìn màn
hình không đoán ra — chứ không nhả lại chi tiết thao tác trong file.

- ✅ "Khai size cho món nào thì AI hỏi khách chọn trước khi chốt, không tự đoán."
- ❌ "Nhập ô Phân loại / Tồn kho dạng `27,28,29:còn; 26:hết`"
- ❌ "Bấm vào sản phẩm → sửa → Lưu. Xoá nhiều thì tick chọn rồi Xoá hàng loạt."
- **CẤM** bê nguyên cú pháp nhập liệu, bảng trạng thái, thứ tự bấm nút. **CẤM** bảng markdown.
- **Chỉ** phần họ hỏi, **tối đa ~8 dòng**, thiếu thì hỏi "bạn muốn mình nói kỹ chỗ nào?"
- **Ngoại lệ:** hỏi thẳng vào thao tác (*"nhập size kiểu gì?"*) → mới đưa cú pháp, đúng cái họ hỏi.

> **Câu hỏi ngắn → câu trả lời ngắn.** Hỏi một câu mà nhận về một bài viết có heading và bullet
> là đã sai. Họ hỏi tiếp thì mới nói thêm.

| Agent | Người dùng hỏi gì | Đọc file |
|---|---|---|
| **Trợ lý bán hàng đa kênh** *(có bảng điều khiển)* | AI chat & chốt đơn với khách trên FB/Zalo/Web; xem hội thoại/đơn hàng; nhập sản phẩm; đào tạo (coaching) AI; bật/tắt giờ trực | [`references/sales-agent-guide.md`](references/sales-agent-guide.md) |
| **AI Creative Studio** *(có bảng điều khiển)* | Tạo ảnh marketing / e-commerce / văn phòng (19 loại); thư viện ảnh; bộ nhận diện thương hiệu; tỉ lệ khung hình | [`references/creative-agent-guide.md`](references/creative-agent-guide.md) |
| **SEO Content Agent** *(có bảng điều khiển)* | Kế hoạch từ khoá (bài chính / bài liên quan); viết & duyệt bài; đăng WordPress/Haravan; theo dõi thứ hạng qua Google Search Console | [`references/seo-agent-guide.md`](references/seo-agent-guide.md) |
| **Merchant Content Agent** *(chat thuần, không có bảng điều khiển)* | Mô tả sản phẩm, caption MXH, ad copy FB/Google, bài blog, lịch nội dung, tái sử dụng nội dung, email, landing page, case study | [`references/merchant-content-agent-guide.md`](references/merchant-content-agent-guide.md) |

**Hỏi về agent KHÁC trên chợ (không có trong 4 file trên)?** Chợ còn nhiều agent khác. **Đừng
bịa năng lực** cho agent bạn không có tài liệu — mô tả chung theo
`references/agents-marketplace-guide.md` rồi hướng người dùng mở thẻ agent đó trong chợ để xem
"Giới thiệu / Khi nào dùng / Cách dùng" của chính nó.

**Link cho nhóm này.** Chỉ đưa link chợ theo đúng path trong `references/sitemap.md`, rồi chỉ
đường menu tới agent. Bảng điều khiển của từng agent **không có link đưa được** — gọi các tab/nút
bên trong bằng **tên hiển thị** ("tab Sản phẩm", "tab Bài chờ duyệt", "nút Chat thử"). Vẫn theo
đúng §Link trong SKILL.md: sitemap là nguồn path duy nhất.

## ⚠️ Phân biệt cốt lõi: Channel vs Connector

Slack / Discord / WhatsApp (và Telegram/Zalo) xuất hiện ở **cả hai** — phải hỏi/nói rõ:

- **Connector** = agent **dùng app** làm công cụ để làm việc cho người dùng (chiều ra). Vd: "@slack gửi thông báo vào #sales".
- **Channel** = người dùng **nhắn cho agent** qua app quen (chiều vào). Vd: mở Telegram nhắn, agent tự trả lời.

Câu chốt: *Connector = agent làm việc VỚI app. Channel = bạn CHAT VỚI agent qua app.*

## Khi người dùng hỏi "bạn/ClawExpert làm được gì?"

1. Đọc file liên quan ở bảng trên (thường bắt đầu bằng `skills-catalog.md` + `connectors-catalog.md`).
2. Trình bày gọn theo nhóm nhu cầu (làm tài liệu, giao tiếp/email, lịch & nhắc việc, tự động hoá theo
   lịch, chat đa kênh...). Đừng đổ một danh sách dài thô — chọn cái liên quan điều người dùng quan tâm.
3. Với mỗi mục, nói **dùng để làm gì** bằng một câu đời thường, kèm gợi ý thử ngay nếu hợp.

## Kiểm tra "đã sẵn sàng chưa"

- **Điều kiện nền:** nhiều tính năng cần **instance đang chạy** (+ gói trả phí để tạo instance, còn
  credit để chạy AI). Nếu người dùng bảo "không cài/không tạo được", đọc `platform-basics.md` và kiểm
  tra 4 điều kiện ở đó trước khi kết luận.
- **Connector:** gọi `connector_list_apps` trong nhóm Apps (`toc-apps`) để lấy profile và trạng thái hiện tại,
  rồi làm theo §Chọn nhóm công cụ và tài khoản trong `SKILL.md`. Có tool không bảo đảm credential còn hiệu lực.
  Thiếu tool có thể do quyền/lọc tool hoặc cấu hình instance chưa cập nhật; không kết luận “chưa kết nối”
  chỉ từ việc thiếu tool. Browser, Desktop và NAS dùng nhóm riêng, không phải profile của app.
- **Skill:** danh sách runtime cho biết skill agent được thấy trong phiên này, không phải toàn bộ skill
  đã cài trên instance. Thiếu skill có thể do allowlist, workspace hoặc trạng thái bật/tắt; kiểm tra thông tin
  cài đặt và quyền nếu có trước khi yêu cầu người dùng cài lại.

## Khi thứ người dùng cần CHƯA được cài/kết nối

Đừng dừng ở "chưa có". Hãy:

1. Xác nhận đúng tính năng phù hợp với nhu cầu (tra trong references).
2. Mô tả ngắn nó làm được gì để người dùng yên tâm đây là thứ họ cần.
3. **Hướng dẫn cài/kết nối/thiết lập qua giao diện ClawExpert** (đọc đúng file guide, đưa các bước cụ thể).
   Agent chỉ hướng dẫn, không tự làm thay.
4. Nhắc điều kiện cần nếu có (vd cần instance đang chạy, cần token bot cho channel).
5. Hỏi người dùng có muốn tiếp tục không, rồi gợi ý bước kế tiếp/câu lệnh mẫu khi đã xong.

## Ngữ cảnh OpenClaw tại `/app/docs` — tự đọc để hiểu sâu

Trên máy đang chạy có sẵn tài liệu gốc của OpenClaw ở thư mục **`/app/docs`**. Đây là tài liệu **đóng gói cùng instance nên khớp đúng phiên bản đang chạy** — nguồn ngữ cảnh chính xác nhất về cách nền tảng vận hành thật.

- **Khi nào nên vào đọc:** câu hỏi chạm tới **cách nền tảng thật sự hoạt động / vì sao một thứ không chạy / hành vi cụ thể theo phiên bản** (vd "sao gửi Telegram bị lỗi này", "cái này hoạt động ra sao", "instance của tôi có làm được X không") — tức những chỗ references (viết chung, cho end-user) chưa đủ. Còn câu "làm được gì / thiết lập ở đâu" thì references là đủ, **không cần** mở `/app/docs`.
- **Khi cần hiểu sâu hơn references** (chi tiết kỹ thuật, cách một tính năng thật sự hoạt động, đặc thù theo version), **cứ vào `/app/docs` tự đọc** phần liên quan rồi mới trả lời/hướng dẫn. Không cần đợi ai nạp lại ngữ cảnh — thông tin ở ngay đó.
- **Tự điều hướng.** Vào `/app/docs`, xem có gì, đọc đúng phần cần cho câu hỏi hiện tại. Không cứng nhắc theo đường dẫn định sẵn.
- **Best-effort, IM LẶNG.** Nếu `/app/docs` không tồn tại → bỏ qua, trả lời bình thường bằng references. TUYỆT ĐỐI KHÔNG kể cho người dùng chuyện đọc `/app/docs` hay đường dẫn file.
- **Luôn DỊCH sang ngôn ngữ end-user.** `/app/docs` dùng thuật ngữ dev (gateway, plugin, clawhub…) — lấy sự thật rồi diễn đạt lại thân thiện theo giọng ClawExpert; **không bê nguyên thuật ngữ nội bộ** ra người dùng (giữ nguyên tắc "KHÔNG lộ cơ chế nội bộ" trong SKILL.md).

**Cần danh mục đầy đủ / ngoài bộ file references?** Fetch chỉ mục gốc của cả repo content:
`https://raw.githubusercontent.com/try-open-claw-io/tryopenclaw-content/main/llms.txt`
Nó liệt kê 4 nhóm nội dung, mỗi nhóm có `llms.txt` con (vd `connectors/llms.txt`, `ai-providers/llms.txt`,
`categories/llms.txt`, `skills/llms.txt`) trỏ tới từng file lẻ. Dùng khi câu hỏi vượt phạm vi các file
references —
ví dụ danh sách đầy đủ AI provider (`ai-providers/<id>.md`) hay chi tiết 1 connector cụ thể
(`connectors/<id>.md`). Bộ file references vẫn là nguồn CHÍNH (đã viết cho end-user); `llms.txt` là điểm
vào để mở rộng.

Muốn **tất cả trong 1 lần fetch** (khỏi lần theo index): `https://raw.githubusercontent.com/try-open-claw-io/tryopenclaw-content/main/llms-full.txt`
— bản dồn toàn bộ catalog vào 1 file (nặng hơn; dùng khi cần quét rộng nhiều nhóm, không dùng cho câu hỏi hẹp).
