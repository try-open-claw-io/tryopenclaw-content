---
id: gitlab
name:
  vi: "GitLab"
  en: "GitLab"
description:
  vi: "Quản lý code Git kèm tự động build và deploy. Có thể cài lên server riêng thay vì dùng dịch vụ cloud — phù hợp team kỹ thuật cần kiểm soát hạ tầng."
  en: "Git code hosting with automated build and deploy. Can run on your own server instead of a cloud service — fits engineering teams that need infrastructure control."
category: engineering
popular: true
howToUse:
  vi:
    - "Gõ @gitlab trong câu nhắn là agent vào thẳng repo của nhóm."
    - "Xem merge request, tạo issue, chạy pipeline."
    - "Hợp nhóm muốn tự dựng hạ tầng trên server riêng."
  en:
    - "Type @gitlab in your message and the agent goes straight to your team's repo."
    - "Review merge requests, create issues, and run pipelines."
    - "Great for teams that want to run their own infrastructure on a private server."
tutorials:
  - title:
      vi: "List MR chờ review"
      en: "List open MRs"
    prompt:
      vi: "Liệt kê merge request đang chờ review trong GitLab."
      en: "List open merge requests waiting for review in GitLab."
  - title:
      vi: "Tạo issue"
      en: "Create an issue"
    prompt:
      vi: "Tạo issue mới priority cao: pipeline build fail."
      en: "Create a new high-priority issue: pipeline build failure."
  - title:
      vi: "Trigger pipeline"
      en: "Trigger pipeline"
    prompt:
      vi: "Chạy pipeline CI cho branch main repo [tên repo] trên GitLab."
      en: "Trigger the CI pipeline for the main branch of repo [tên repo] on GitLab."
---

<!-- Body for future rich docs -->
