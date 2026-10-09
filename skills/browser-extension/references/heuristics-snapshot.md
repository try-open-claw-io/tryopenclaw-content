# Heuristic điều khiển trình duyệt — phần 3: snapshot, find, overlay

> File hướng dẫn của skill `browser-extension`, dành cho **chính agent**. Phần 1 (`heuristics-basics.md`)
> có danh sách công cụ, checklist trang lạ, ranh giới an toàn và mục 1–11; phần 2 (`heuristics-actions.md`)
> có mục 12–15; file này tiếp mục 16–17.

## 16. `BROWSER_SNAPSHOT` (toàn cảnh) vs `BROWSER_FIND` (đích danh) — và `depth` cho trang lớn

**Nguyên tắc**: `BROWSER_SNAPSHOT` để **nắm tổng thể** (cấu trúc trang + mọi `ref` trong một lần); `BROWSER_FIND` khi **đã biết chính xác element cần** — mô tả nó bằng `{role, name}` nhanh hơn tự dò trong một snapshot dài. Lưu ý: `BROWSER_FIND` của nền tảng này nhận **role + name có cấu trúc** (kèm `container`/`path`/`near` để phân biệt), **không** phải mô tả ngôn ngữ tự nhiên tự do. Muốn "nút Like của bài ĐẦU TIÊN" giữa nhiều nút "Like": `BROWSER_FIND {role:"button", name:"Like"}` rồi chọn match theo `path`/`container`, chứ không truyền cả câu mô tả.

**Dùng `BROWSER_SNAPSHOT` khi:**
- Mới vào một trang/khu vực lạ, chưa biết có những gì — cần bản kê đầy đủ element tương tác để lập kế hoạch (xem checklist "vừa đáp xuống" ở `heuristics-basics.md`).
- Cần **nhiều `ref` cùng lúc** cho các bước sắp làm — một `BROWSER_SNAPSHOT` rẻ hơn nhiều lần `BROWSER_FIND` lẻ khi cần ≥3-4 element.
- Cần hiểu **quan hệ cha-con / thứ bậc** (element nào nằm trong post/section nào) — snapshot cho thấy cây, `BROWSER_FIND` chỉ trả element rời kèm container/path ngắn.

**Trang quá lớn** → đừng để snapshot bị cắt ở trần kích thước (phần bị cắt là ĐUÔI `<body>` — đúng nơi portal/modal mount). Hai cách thu hẹp giữ được lợi thế "thấy toàn cảnh": (a) scope bằng `selector`/`ref` vào đúng nhánh cần; (b) truyền **`depth`** thấp cho `BROWSER_SNAPSHOT` — `depth:1` chỉ các landmark/region ngoài cùng, `depth:2` thêm con trực tiếp của chúng… `ref` trên các dòng nông vẫn dùng được, và kết quả có `depthHidden` cho biết còn bao nhiêu nhánh sâu bị ẩn để bạn scope vào từng cái.

**Dùng `BROWSER_FIND` khi** (ngoài ca "nhiều control trùng tên" ở mục 17):
- **Thao tác 1 trong NHIỀU control lặp theo item** (mỗi skill/hàng/card có nút `"Edit"`/`"Delete"` riêng, tên gần giống nhau — vd trang LinkedIn Skills) → `BROWSER_FIND {role:"button", name:"Edit <tên item>"}` ra thẳng `ref` đúng item, thay vì `BROWSER_SNAPSHOT` cả `role=main` rồi tự dò `ref`, và **thay vì đoán CSS selector** (đoán `button[aria-label*=...]` gần như luôn timeout).
- **`BROWSER_SNAPSHOT` bị `truncated` trên trang khổng lồ** và element cần nằm sau phần bị cắt → `BROWSER_FIND {role, name}` lấy thẳng `ref`. Kết quả FIND luôn nhỏ (tối đa ~10 match, dựng từ một ariaSnapshot phân tích phía server) nên **không dính trần kích thước** như snapshot — đây là đường lấy ref khi trang lớn tới mức snapshot không đủ chỗ.
- **Element vừa xuất hiện sau một hành động** (hover mở reaction picker, click mở dropdown) → `BROWSER_FIND` đi thẳng phần mới sinh ra, thay vì `BROWSER_SNAPSHOT` lại cả trang (phần lớn không đổi). Thay thế tương đương: `BROWSER_SNAPSHOT {selector}` scope theo `ref`/`role` của overlay (mục 17).

**Workflow thực tế**: `BROWSER_SNAPSHOT` (hoặc `depth` thấp) một lần để nắm toàn cảnh → xác định `ref` gốc của vùng cần thao tác → `BROWSER_HOVER`/`BROWSER_CLICK` kích hoạt trạng thái mới → `BROWSER_FIND` để lấy đúng `ref` của phần vừa xuất hiện, thay vì snapshot lại từ đầu.

## 17. Overlay/dialog không thấy trong snapshot, và nhiều control TRÙNG TÊN

**Dialog/dropdown vừa mở mà `BROWSER_SNAPSHOT` không thấy ref nào của nó** → trang dài làm snapshot full-page bị cắt ở trần kích thước, mà portal (modal, reaction picker, dropdown menu) lại được mount vào CUỐI `<body>` — đúng phần bị cắt mất. Chụp scoped: gọi `BROWSER_SNAPSHOT` kèm `selector` — dùng **role engine** cho mọi landmark/overlay: `role=dialog`, `role=navigation`, `role=main`, `role=listbox`… (match cả role NGẦM ĐỊNH — các thẻ native `<dialog>`/`<nav>`/`<main>`/`<form>` không có attribute role nên dạng CSS `[role="dialog"]` sẽ trượt); tag thuần (`dialog`, `nav`, `main`) cũng được, CSS chỉ dùng khi cần bám attribute/class cụ thể. Cây trả về nhỏ, đầy đủ ref của riêng overlay — ref dùng cho `BROWSER_CLICK`/`BROWSER_FILL` như thường. Đừng đoán mò CSS selector trong modal, và đừng bê role name từ text snapshot (vd `generic`) ra làm selector.

**Nhiều control TRÙNG TÊN** (vd nút "Comment" ở action bar của post và nút "Comment" submit trong ô soạn — cùng accessible name) → dùng `BROWSER_FIND {role, name}`: nó liệt kê MỌI match kèm **container** (form/dialog/article/list…), **path** tổ tiên, **`near`** (input/heading gần nhất trong cùng container), và **`ref`** của từng cái. Đọc để chọn đúng: khi mọi match cùng `container` (vd LinkedIn bọc mọi post trong `listitem`), dùng **`near`** — nút submit của editor có `near` = chính textbox vừa fill, còn nút action-bar thì `near: null`. Rồi `BROWSER_CLICK`/`BROWSER_FILL` bằng chính `ref` đó. FIND dựng từ 1 ariaSnapshot nên chạy được cả trên trang nặng nơi thao tác per-element bị timeout. Ref chỉ sống tới lần snapshot kế tiếp — click ngay sau FIND.

**Tìm nút SUBMIT sau khi fill một ô soạn** → đừng đoán tên "Submit"/"Post comment": nhiều site đặt nút gửi TRÙNG TÊN hành động (LinkedIn: nút gửi comment tên **"Comment"**, y hệt nút toggle). Cách chắc ăn: FIND lại đúng tên hành động đó rồi chọn match có **`near`** là textbox vừa fill. Hoặc `BROWSER_SNAPSHOT {selector: "<ref-của-textbox>"}` (scope nhận thẳng ref, vd `e1883`) để thấy nút submit nằm kề bên.

Snapshot scoped match NHIỀU element thì trả về match #1 (có ref) + tổng số; muốn phân biệt thì chuyển sang `BROWSER_FIND`.
