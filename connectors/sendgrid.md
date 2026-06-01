---
id: sendgrid
name:
  vi: "SendGrid"
  en: "SendGrid"
description:
  vi: "Gửi mail tự động cho từng giao dịch. Xác nhận đơn, mã OTP, đặt lại mật khẩu — mail vào thẳng inbox không bị rớt vào spam."
  en: "Send automated emails for each transaction. Order confirmations, OTPs, and password resets — delivered to the inbox, not spam."
category: communication
popular: true
howToUse:
  vi:
    - "Gõ @sendgrid trong câu nhắn là agent gửi mail tự động cho từng giao dịch."
    - "Mail xác nhận đơn, mã OTP, đặt lại mật khẩu; xem được mail nào gửi thành công hay bị trả lại."
    - "Hợp mail gửi riêng từng người; còn mail quảng cáo cả danh sách thì dùng Mailchimp."
  en:
    - "Type @sendgrid in your message and the agent sends automated emails for each transaction."
    - "Order confirmations, OTP codes, password resets; see which emails landed and which bounced."
    - "Best for one-to-one emails; for bulk promo emails to a whole list, use Mailchimp."
tutorials:
  - title:
      vi: "Mail xác nhận đơn"
      en: "Send order confirmation"
    prompt:
      vi: "Gửi mail xác nhận đơn hàng kèm mã đơn cho khách qua SendGrid."
      en: "Send an order confirmation email with the order code to the customer via SendGrid."
  - title:
      vi: "Mail OTP"
      en: "Send OTP"
    prompt:
      vi: "Gửi mail OTP đăng nhập cho khách qua SendGrid."
      en: "Send a login OTP email to the customer via SendGrid."
  - title:
      vi: "Thống kê delivery"
      en: "Delivery stats"
    prompt:
      vi: "Mail xác nhận tuần này có bao nhiêu mail bounce trên SendGrid?"
      en: "How many confirmation emails bounced on SendGrid this week?"
---

<!-- Body for future rich docs -->
