---
id: airtable
name:
  vi: "Airtable"
  en: "Airtable"
description:
  vi: "Cơ sở dữ liệu dạng bảng đẹp mắt. Quản lý catalog sản phẩm, content calendar, pipeline — link bảng với bảng linh hoạt."
  en: "A beautiful spreadsheet-database hybrid. Manage product catalogs, content calendars, and pipelines — flexibly link tables together."
category: documents
popular: true
howToUse:
  vi:
    - "Tham chiếu @airtable trong prompt — agent tự pick base và table phù hợp theo ngữ cảnh."
    - "Dùng để đọc/ghi record, filter theo điều kiện, hoặc batch-update field từ nguồn khác (Sheets, mail, chat)."
    - "Mẹo: pin Airtable vào session khi làm việc liên tục với 1 base — đỡ phải gắn lại mỗi tin nhắn."
  en:
    - "Reference @airtable in your prompt — the agent picks the right base and table based on context."
    - "Use it to read/write records, filter by condition, or batch-update fields from other sources (Sheets, email, chat)."
    - "Tip: pin Airtable to a session when working with one base continuously — no need to re-attach each message."
tutorials:
  - title:
      vi: "Thêm sản phẩm"
      en: "Add a product"
    prompt:
      vi: "Thêm sản phẩm mới vào Airtable catalog: tên, giá, ảnh, tồn kho."
      en: "Add a new product to the Airtable catalog: name, price, photo, stock."
  - title:
      vi: "Tìm record"
      en: "Find records"
    prompt:
      vi: "Tìm các sản phẩm tồn dưới 10 trong table 'Inventory'."
      en: "Find products with stock below 10 in the 'Inventory' table."
  - title:
      vi: "Cập nhật field"
      en: "Update a field"
    prompt:
      vi: "Cập nhật trạng thái record [tên record] sang 'Đã giao' trong Airtable."
      en: "Update record [tên record] status to 'Delivered' in Airtable."
---

<!-- Body for future rich docs -->
