<!-- Trả lời theo §HAI TẦNG TRẢ LỜI trong SKILL.md của skill toc-guidelines.
     Hỏi "là gì / làm được gì" → 1 câu định vị + 3-5 gạch đầu dòng + "Hợp với: ..."
       + "Bạn muốn biết kỹ hơn phần nào?". Không heading, không bảng, không kể tab/nút.
     Hỏi chi tiết / cách làm → nói HÀNH VI của agent, không nhả lại thao tác trong file.
     Đọc hết file KHÔNG có nghĩa là kể lại hết file. -->

# SEO Content Agent

SEO Content Agent viết bài cho website của bạn, để khách tìm thấy bạn trên Google.

Nó đọc website để hiểu bạn bán gì, rồi tìm xem khách đang gõ những gì lên Google khi cần thứ bạn bán. Từ đó nó lên danh sách bài nên viết, và viết sẵn cho bạn — đúng giọng văn bạn muốn.

Bạn đọc, sửa nếu thấy cần, rồi bấm duyệt. Bài đăng thẳng lên website của bạn (WordPress hoặc Haravan).

Nó luôn giữ sẵn một ít bài đã viết đang chờ bạn duyệt, nên lúc nào bạn cũng có bài để đăng. Bài nào đăng rồi mà bị tụt trên Google, nó báo bạn và viết lại.

Nó không tự đăng gì cả — bài nào cũng phải qua tay bạn duyệt.

**Hợp với:** chủ website muốn có bài đều đặn lên Google mà không phải thuê người viết hay tự ngồi nghiên cứu từ khoá.

**Cần chuẩn bị:** địa chỉ website của bạn. Có thêm tài khoản Google Search Console và WordPress/Haravan thì dùng được đầy đủ hơn.

---

## Mục lục

1. [Thiết lập lần đầu](#1-thiết-lập-lần-đầu)

2. [Màn hình chính](#2-màn-hình-chính)

3. [Lên kế hoạch bài viết](#3-lên-kế-hoạch-bài-viết)

4. [Viết và đăng bài](#4-viết-và-đăng-bài)

5. [Lịch đăng bài](#5-lịch-đăng-bài)

6. [Bài cần sửa lại](#6-bài-cần-sửa-lại)

7. [Cài đặt](#7-cài-đặt)

8. [Nhờ agent làm nhanh bằng chat](#8-nhờ-agent-làm-nhanh-bằng-chat)

9. [Câu hỏi thường gặp](#9-câu-hỏi-thường-gặp)

---

## 1. Thiết lập lần đầu

Khi mới vào, agent sẽ dẫn bạn qua 3 bước:

### Bước 1 — Thêm website

- Nhập địa chỉ website của bạn (ví dụ: [`myshop.vn`](http://myshop.vn))

- Agent tự crawl và đọc nội dung để hiểu bạn đang kinh doanh gì

- Quá trình này mất một chút

### Bước 2 — Kết nối Google Search Console

- Google Search Console (GSC) là nguồn dữ liệu THẬT về số lượt xem, lượt nhấp, và thứ hạng từ khoá của bài viết

- Kết nối bằng tài khoản Google, chọn website của bạn

- Không có GSC vẫn dùng được, nhưng sẽ không thấy số liệu hiệu quả thực tế

- Có thể bỏ qua bước này và "Kết nối sau"

### Bước 3 — Kết nối WordPress hoặc Haravan

- Bước này cho phép agent đăng bài trực tiếp sau khi bạn duyệt

- Có thể bỏ qua và làm sau trong tab Cài đặt

### Sau khi thiết lập xong

Hệ thống sẽ hỏi bạn muốn bắt đầu bằng cách nào:

| Lựa chọn | Phù hợp khi |

|---|---|

| **Viết bài đầu tiên** | Bạn muốn thử ngay với 1 từ khoá cụ thể |

| **Lên kế hoạch SEO** | Bạn muốn xây kế hoạch bài bản từ đầu |

| **Import từ Google Sheets** | Bạn đã có sẵn danh sách từ khoá |

**Bạn thêm được nhiều website** trong cùng một tài khoản. Dùng bộ chọn site góc trên phải để chuyển qua lại.

---

## 2. Màn hình chính

Tab đầu tiên sau khi setup xong. Gồm 3 phần:

### Chỉ số hiệu quả (từ Google Search Console)

Nếu đã kết nối GSC, bạn sẽ thấy:

- **Lượt thấy** — bài xuất hiện bao nhiêu lần trên Google

- **Lượt nhấp** — bao nhiêu người bấm vào

- **Tỉ lệ nhấp** — % người thấy rồi bấm

- **Thứ hạng trung bình** — vị trí trung bình trên kết quả tìm kiếm

Chọn được khoảng thời gian (7 ngày, 28 ngày, 3 tháng…) và so sánh với kỳ trước.

### Việc cần làm

Danh sách bài đang cần bạn xử lý, chia theo trạng thái:

- **Bài tụt hạng** — cần tối ưu lại

- **Bài chờ duyệt** — agent đã viết, đang chờ bạn xem

- **Bài chờ đăng** — bạn đã duyệt, chưa đăng lên web

### Hoạt động của agent

Tóm tắt những việc agent đã làm gần đây: đã viết bao nhiêu bài, tối ưu bao nhiêu bài, import từ khoá...

---

## 3. Lên kế hoạch bài viết

Đây là nơi bạn xây kế hoạch nội dung. Có hai chế độ xem:

- **Bảng (Tracker)** — danh sách từ khoá dạng bảng, thấy được thứ hạng, lượt nhấp từng từ

- **Sơ đồ (Map)** — sơ đồ dạng mạng nhện: chủ đề lớn ở giữa, bài liên quan toả ra xung quanh

### Cách thêm từ khoá

**Cách 1: Gõ/dán thẳng vào chat**

```

add keyword: cách chăm sóc cây kiểng, đất trồng cây, phân bón hữu cơ

```

Agent sẽ tự gom các từ khoá theo chủ đề, hiển thị bảng phân nhóm để bạn xem trước rồi hỏi "Thêm vào nhé?". Xác nhận xong mới ghi vào hệ thống.

**Cách 2: Import từ Google Sheets**

Dán link Google Sheet chứa danh sách từ khoá vào chat. Sheet cần được set "Anyone with the link — Viewer". Agent tự đọc và phân nhóm theo chủ đề.

&gt; Lưu ý: Không nhận file CSV hay file đính kèm. Chỉ nhận list gõ thẳng hoặc link Google Sheets.

**Cách 3: Bấm "+ Thêm" trong giao diện**

- "+ Thêm chủ đề" — agent gợi ý chủ đề phù hợp dựa trên thông tin doanh nghiệp, bạn chọn và mở rộng thành bộ từ khoá

- "+ Thêm từ khoá" — tải lên Google Sheet hoặc gõ danh sách

### Hiểu cấu trúc Bài chính &amp; Bài liên quan

Mỗi chủ đề (ví dụ: "Cây kiểng văn phòng") gồm:

- **Bài chính (Pillar)** — bài bao quát toàn bộ chủ đề, từ khoá cạnh tranh cao

- **Bài liên quan (Support)** — các bài đi sâu vào từng khía cạnh, từ khoá cụ thể hơn, dễ lên hạng hơn

Nguyên tắc: **1 chủ đề = 1 bài chính + nhiều bài liên quan**. Không để 2 bài chính cùng nói về 1 chủ đề (sẽ tự cạnh tranh nhau trên Google).

### Phát hiện bài trùng lặp

Bấm nút "Check trùng blog" trên Bản đồ nội dung. Agent sẽ phân tích toàn bộ danh sách từ khoá và:

- Gộp các từ khoá có cùng ý định tìm kiếm ("cách cài X" và "hướng dẫn setup X" = 1 nhóm)

- Giữ nguyên các bài khác ngôn ngữ (bài tiếng Việt và bài tiếng Anh về cùng chủ đề KHÔNG phải trùng lặp)

- Chỉ đề xuất — không tự xoá bài nào

---

## 4. Viết và đăng bài

Tab này là trung tâm viết bài. Agent tự giữ sẵn một ít bài đã viết trong hàng chờ để bạn có bài duyệt bất cứ lúc nào.

### Trạng thái của mỗi bài

| Trạng thái | Ý nghĩa |

|---|---|

| **Chưa viết** | Chỉ có từ khoá, chưa có nội dung |

| **Chờ duyệt** | Agent đã viết xong, đang chờ bạn xem |

| **Đã duyệt** | Bạn đã duyệt, chưa đăng lên web |

| **Đã đăng** | Bài đang live trên website |

### Mở một bài và viết

Mỗi bài có hai lựa chọn:

- **"Viết bài"** — agent viết bản nháp đầy đủ

- **"Tối ưu bài"** — viết lại bài cũ đang tụt hạng

Chọn xong là agent bắt tay vào viết ngay, không hỏi lại.

### Editor bài viết

Sau khi agent viết xong, bạn thấy:

- **Nội dung đầy đủ** — thân bài, tiêu đề, mô tả cho Google (meta)

- **Dàn ý** — cấu trúc H1/H2/H3 của bài

- **Internal links** — các liên kết nội bộ agent đề xuất thêm vào bài

- **Trạng thái đăng** — chưa đăng / chờ đăng / đã đăng

Bạn có thể sửa trực tiếp trong khung tạo ảnh rồi bấm **"Lưu nháp"** hoặc **"Đăng bài"**.

### Thêm ảnh

Agent **không tự tạo ảnh** sau khi viết bài (để tránh tốn chi phí không cần thiết). Sau khi bài viết xong, agent sẽ nhắc bạn:

- Nếu bạn muốn tạo ảnh: nói "tạo ảnh cho bài này" hoặc "thêm thumbnail"

- Agent tạo ảnh đại diện và một vài ảnh minh hoạ trong bài

- Ảnh được tự động đẩy lên WordPress, không cần upload tay

### Sửa title và meta nhanh

Đang xem một bài và muốn chỉnh tiêu đề hoặc mô tả ngắn cho Google? Nói thẳng trong chat:

- "Rút gọn meta description này"

- "Sửa lại title cho hấp dẫn hơn"

- "Meta title dài quá, bỏ bớt"

Agent tự đọc bài đang mở và sửa đúng ô đó, không cần bạn dán nội dung vào.

### Quy tắc viết bài của agent

Agent viết bài theo giọng thương hiệu bạn đã lưu trong Cài đặt, bao gồm:

- Cách xưng hô (bạn/quý khách/anh chị)

- Câu ngắn hay câu dài

- Có dùng số liệu không, dùng ngôn ngữ chuyên ngành không

Agent **không bịa số liệu** và không trích dẫn nghiên cứu giả. Chỉ dùng thông tin từ hồ sơ doanh nghiệp bạn đã nhập.

---

## 5. Lịch đăng bài

Tab này cho bạn thấy toàn bộ kế hoạch bài viết theo thời gian.

### Lịch đăng bài

- Mỗi ô = 1 ngày, mỗi ngày 1 bài

- Màu sắc thể hiện trạng thái: chưa viết / đã viết / đã duyệt / đã đăng

- Bài quá hạn chưa đăng → agent tự đăng ngay khi bạn kết nối WordPress

### Theo dõi chỉ số

Nếu đã kết nối GSC, mỗi bài đã đăng sẽ có:

- Lượt thấy (impressions)

- Lượt nhấp (clicks)

- Tỉ lệ nhấp (CTR)

- Thứ hạng trung bình

Bài nào tụt lượt nhấp rõ rệt so với kỳ trước sẽ tự được đánh dấu "Cần tối ưu" và hiện ở tab Bài cần xử lý.

### Luật bài đệm

Agent tự duy trì một hàng chờ bài đã viết. Hàng chờ vơi đi thì nó tự viết bù vào. Bài viết xong nằm ở trạng thái "Chờ duyệt" — chỉ bạn mới bấm Duyệt, agent không tự duyệt.

---

## 6. Bài cần sửa lại

Tab này tập hợp các bài đang có vấn đề cần bạn chú ý.

### Bài đang tụt hạng

Agent so kỳ gần nhất với kỳ trước đó từ GSC. Bài nào tụt lượt nhấp rõ rệt thì vào danh sách "Cần tối ưu".

Khi bạn bấm vào một bài tụt hạng:

- Hệ thống tự hiện nút "Tối ưu bài"

- Agent viết lại bài với dàn ý mới, giữ nguyên từ khoá chính

- Hoặc gõ "ok" trong chat nếu vừa xem xong gợi ý

### Audit SEO từng bài

Mỗi bài có thể chạy kiểm tra SEO chi tiết. Kết quả gồm danh sách vấn đề được tìm thấy, ví dụ:

- Meta title quá dài / thiếu từ khoá

- Meta description không nằm trong giới hạn ký tự

- Thiếu internal links

Bạn chọn những mục muốn sửa, agent chỉ sửa đúng các mục đó và đưa bản so sánh trước/sau để bạn xem. Phần còn lại của bài giữ nguyên.

&gt; Lưu ý: "Áp dụng" chỉ chuẩn bị bản xem trước, không tự lưu/đăng. Bạn phải bấm nút lưu của khung tạo ảnh mới commit.

---

## 7. Cài đặt

Tab này quản lý toàn bộ cấu hình cho từng website.

### Thông tin doanh nghiệp

Agent dùng thông tin này để viết bài đúng ngữ cảnh:

- **Hồ sơ doanh nghiệp** — bạn bán gì, cho ai, điểm khác biệt so với đối thủ

- **Giọng thương hiệu** — cách viết, cách xưng hô, phong cách (thân thiện / chuyên nghiệp / vui vẻ...)

- **Ngôn ngữ** — tiếng Việt, tiếng Anh, hoặc ngôn ngữ khác

- **Vùng thị trường** — ảnh hưởng đến dữ liệu lượng tìm kiếm (volume)

Khi bạn nhập URL website ở bước thiết lập, agent tự crawl và điền sẵn các trường này. Bạn có thể chỉnh lại bất cứ lúc nào.

### Kết nối các dịch vụ

**Google Search Console**

- Cấp dữ liệu thứ hạng thật của bài viết

- Đăng nhập bằng tài khoản Google rồi chọn website

**WordPress**

- Cho phép đăng bài trực tiếp sau khi duyệt

- Nối bằng mã kết nối, hoặc mật khẩu ứng dụng (Application Password) của WordPress

- Sau khi kết nối, agent kéo về danh sách bài đã đăng và gom vào đúng chủ đề

**Haravan**

- Tương tự WordPress, dùng cho website trên nền tảng Haravan

### FAQ của site

Bạn có thể thêm các câu hỏi thường gặp của khách hàng vào đây. Agent dùng khi viết bài để không bỏ sót những thắc mắc phổ biến.

---

## 8. Nhờ agent làm nhanh bằng chat

Ngoài việc bấm nút trong giao diện, bạn có thể nói chuyện trực tiếp với agent để làm mọi thứ nhanh hơn.

### Viết và tối ưu bài

Chọn **Viết bài** thì agent ra bản nháp đầy đủ. Chọn **Tối ưu bài** thì nó viết lại với dàn ý mới. Còn vừa xem gợi ý bài tụt hạng xong, chỉ cần gõ "ok" là nó tự lấy bài cần tối ưu ra viết.

### Thêm từ khoá qua chat

```

add keyword: từ khoá 1, từ khoá 2, từ khoá 3

```

Hoặc dán link Google Sheets (không cần qua giao diện).

### Sửa meta nhanh

Đang xem bài trong khung tạo ảnh, gõ:

- "Rút gọn meta description"

- "Sửa title ngắn lại"

- "Meta title đang dài quá"

Agent tự đọc bài đang mở, sửa, áp dụng ngay — không cần bạn dán nội dung vào chat.

### Tạo ảnh

Sau khi bài được viết:

- "Tạo ảnh cho bài này"

- "Thêm thumbnail cho bài #123"

- "Vẽ ảnh minh hoạ cho bài"

---

## 9. Câu hỏi thường gặp

**Agent viết xong, tôi thấy bài ở đâu?**

Bài nằm trong tab "Bài chờ duyệt". Chờ trạng thái chuyển từ "Chờ duyệt" sang khung tạo ảnh hiển thị nội dung. Nếu đang trong onboarding, bài hiện ngay trên màn hình.

**Bài viết có cần tôi sửa không?**

Không bắt buộc. Agent viết theo thông tin bạn đã nhập. Nếu thông tin doanh nghiệp và giọng thương hiệu đầy đủ, bài thường chỉ cần đọc lại và duyệt. Bạn có thể sửa thoải mái trong khung tạo ảnh trước khi duyệt.

**Tại sao có bài agent không tự viết, phải bấm nút?**

Để bạn quyết định bài nào được viết trước, không tốn chi phí vào bài không cần thiết. Agent chỉ tự viết bù khi hàng chờ vơi đi.

**Tôi có thể thêm bài từ WordPress vào hệ thống không?**

Có. Sau khi kết nối WordPress, agent kéo về danh sách bài đã đăng và gợi ý gom vào các chủ đề phù hợp. Bạn xác nhận cách phân nhóm rồi lưu.

**Bài không thấy thứ hạng?**

Cần kết nối Google Search Console, và bài phải đăng được một thời gian mới có đủ dữ liệu.

**Tôi có thể quản lý nhiều website không?**

Có. Dùng bộ chọn site góc trên phải để chuyển qua lại.

**Agent có tự đăng bài không?**

Không tự đăng. Bài phải qua tay bạn duyệt trước. Sau khi duyệt, bạn bấm "Đăng bài" thì mới lên WordPress/Haravan. Bài có ngày đặt trước → hẹn giờ đăng; bài đã qua ngày → đăng ngay.

**Tôi không có Google Search Console thì có dùng được không?**

Được, nhưng sẽ không thấy số liệu thứ hạng thật và tab "Bài cần xử lý" sẽ không có dữ liệu để phân tích. Nên kết nối GSC để dùng đủ tính năng.

**Agent viết sai giọng thương hiệu của tôi phải làm sao?**

Vào Cài đặt → chỉnh lại mục "Giọng thương hiệu" cho rõ hơn (ví dụ: "xưng em, gọi khách là anh/chị", "câu ngắn", "không dùng từ chuyên ngành"). Bài tiếp theo sẽ đúng hơn.

---

## Bắt đầu nhanh

1. Thêm website → agent đọc và hiểu doanh nghiệp

2. Kết nối Google Search Console (hoặc bỏ qua)

3. Kết nối WordPress/Haravan (hoặc bỏ qua)

4. Chọn 1 trong 3 hướng: Viết bài đầu tiên / Lên kế hoạch SEO / Import từ khoá

5. Duyệt bài đầu tiên → đăng lên web

6. Quay lại bảng điều khiển hàng tuần để xem bài nào cần tối ưu