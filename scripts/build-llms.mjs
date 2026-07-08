#!/usr/bin/env node
// Sinh toàn bộ hệ thống llms.txt cho tryopenclaw-content từ nội dung nguồn.
// - mỗi thư mục con 1 llms.txt (index file + mô tả 1 dòng)
// - root llms.txt (catalog index, trỏ tới các llms.txt con)
// - llms-full.txt (bản dump 1 file toàn bộ frontmatter)
// Chạy:  node scripts/build-llms.mjs         → ghi file
//        node scripts/build-llms.mjs --check → chỉ so drift, exit 1 nếu lệch (CI)
//
// WHY generator thay vì sửa tay: nội dung nguồn là source of truth; index/dump phải
// bám theo nên phải sinh lại, tránh drift âm thầm (CI --check giữ đồng bộ).

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

const oneLine = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const clip = (s, n = 160) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);
const descVi = (o) => oneLine(o?.description?.vi || o?.description?.en || o?.name?.vi || '');
const descEn = (o) => oneLine(o?.description?.en || '');
const nameVi = (o) => oneLine(o?.name?.vi || o?.id || '');

// đọc frontmatter mọi *.md (bỏ file _*) trong 1 thư mục, sort theo tên
function readMdDir(dir) {
  return readdirSync(join(ROOT, dir))
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .sort()
    .map((f) => ({ file: f, fm: matter.read(join(ROOT, dir, f)).data }));
}
function specialFiles(dir) {
  return readdirSync(join(ROOT, dir))
    .filter((f) => f.startsWith('_'))
    .sort();
}
// skills: mỗi skill là 1 thư mục có _meta.json
function readSkillDirs(dir) {
  return readdirSync(join(ROOT, dir))
    .filter((f) => statSync(join(ROOT, dir, f)).isDirectory())
    .sort()
    .map((f) => ({ slug: f, meta: JSON.parse(readFileSync(join(ROOT, dir, f, '_meta.json'), 'utf8')) }));
}

const SPECIAL_DESC = {
  '_schema.json': 'JSON Schema validate frontmatter (chạy trong CI).',
  '_rules.md': 'Quy ước biên tập cho thư mục này — đọc trước khi thêm/sửa file.',
  '_rules-skills.md': 'Quy ước biên tập skill — đọc trước khi thêm/sửa skill.',
  '_template.md': 'Khung mẫu để tạo file mới trong thư mục này.',
};

// ---- cấu hình từng thư mục ----
const DIRS = {
  'ai-providers': {
    blurb:
      'Danh mục AI model provider hiển thị ở Config Builder. Mỗi file = 1 provider; frontmatter khớp `_schema.json`. BE poll repo mỗi ~10 phút.',
    section: 'Providers',
    kind: 'md',
  },
  connectors: {
    blurb:
      'Danh mục connector (tích hợp dịch vụ ngoài) hiển thị trong catalog. Mỗi file = 1 connector; frontmatter khớp `_schema.json`.',
    section: 'Connectors',
    kind: 'md',
  },
  categories: {
    blurb:
      'Nhóm phân loại cho connector và skill (icon + displayOrder + appliesTo). Mỗi file = 1 category; frontmatter khớp `_schema.json`.',
    section: 'Categories',
    kind: 'md',
  },
  skills: {
    blurb:
      'Skill dựng sẵn (ClawHub). Mỗi thư mục = 1 skill gồm `_meta.json` (catalog) + `SKILL.md` (instructions) + `README.md` (hướng dẫn dùng).',
    section: 'Skills',
    kind: 'skills',
  },
};

// ---- render per-dir llms.txt ----
function renderDirIndex(dir, cfg) {
  const lines = [`# ${dir} — index`, '', `> ${cfg.blurb}`, ''];

  if (cfg.kind === 'skills') {
    const skills = readSkillDirs(dir);
    lines.push(`## ${cfg.section}`);
    for (const { slug, meta } of skills) {
      lines.push(`- [${slug}/](${slug}/llms.txt): ${clip(descVi(meta))}`);
    }
  } else {
    const items = readMdDir(dir);
    lines.push(`## ${cfg.section}`);
    for (const { file, fm } of items) {
      const tag = fm.popular ? ' *(popular)*' : '';
      lines.push(`- [${file}](${file}): ${clip(descVi(fm))}${tag}`);
    }
  }

  const specials = specialFiles(dir);
  if (specials.length) {
    lines.push('', '## Schema & rules');
    for (const f of specials) {
      lines.push(`- [${f}](${f}): ${SPECIAL_DESC[f] || 'File nội bộ.'}`);
    }
  }
  lines.push('');
  return lines.join('\n');
}

// ---- render per-skill llms.txt (leaf: bộ file cố định của 1 skill) ----
const SKILL_FILE_DESC = {
  'README.md': 'Hướng dẫn sử dụng cho người dùng (vi + en).',
  '_meta.json': 'Metadata catalog: name, category, icon, status, is_published.',
};
function renderSkillIndex(dir, slug, meta) {
  const skillDir = join(ROOT, dir, slug);
  const lines = [`# ${slug} — skill`, '', `> ${descVi(meta)}`, '', '## Files'];
  for (const f of readdirSync(skillDir).sort()) {
    let d = SKILL_FILE_DESC[f];
    if (f === 'SKILL.md') {
      // description trong frontmatter SKILL.md = tín hiệu trigger cho agent
      d = `Instructions agent chạy — ${clip(oneLine(matter.read(join(skillDir, f)).data?.description || ''), 120)}`;
    }
    if (f === 'llms.txt') continue;
    lines.push(`- [${f}](${f}): ${d || 'File của skill.'}`);
  }
  lines.push('');
  return lines.join('\n');
}

// ---- render root llms.txt ----
function renderRoot() {
  const counts = {
    'ai-providers': readMdDir('ai-providers').length,
    connectors: readMdDir('connectors').length,
    categories: readMdDir('categories').length,
    skills: readSkillDirs('skills').length,
  };
  return [
    '# tryopenclaw-content — catalog index',
    '',
    '> Content CMS của nền tảng tryopenclaw: AI providers, connectors, categories, skills.',
    '> Nhóm biên tập sửa file Markdown; BE poll repo mỗi ~10 phút rồi merge vào catalog.',
    '> File này giúp LLM / AI agent khám phá nội dung machine-readable của repo.',
    '',
    '## Catalog',
    `- [ai-providers/](ai-providers/llms.txt): ${counts['ai-providers']} AI model provider (Config Builder).`,
    `- [connectors/](connectors/llms.txt): ${counts.connectors} tích hợp dịch vụ ngoài.`,
    `- [categories/](categories/llms.txt): ${counts.categories} nhóm phân loại cho connector + skill.`,
    `- [skills/](skills/llms.txt): ${counts.skills} skill dựng sẵn (ClawHub).`,
    '',
    '## How agents use this repo',
    '1. Fetch `llms.txt` này để biết 4 nhóm nội dung.',
    '2. Mở `<dir>/llms.txt` để chọn đúng file, rồi fetch file đó.',
    '3. Cần toàn bộ trong 1 lần: [llms-full.txt](llms-full.txt).',
    '',
    '## Conventions',
    '- Mỗi thư mục có `llms.txt` riêng liệt kê từng file + mô tả 1 dòng.',
    '- Markdown cho nội dung, JSON Schema (`_schema.json`) cho ràng buộc frontmatter.',
    '- Đường dẫn ổn định — thay nội dung bằng cách sửa file, không đổi tên file.',
    '- KHÔNG sửa tay `llms.txt` / `llms-full.txt`: chạy `npm run build:llms` để sinh lại.',
    '',
  ].join('\n');
}

// ---- render llms-full.txt (dump 1 file) ----
function renderFull() {
  const out = [
    '# tryopenclaw-content — full context for LLMs',
    '',
    '> Bản dồn 1 file toàn bộ catalog. Sinh tự động từ nội dung nguồn bằng',
    '> `npm run build:llms` — đừng sửa tay, chỉnh ở file nguồn rồi build lại.',
    '',
  ];

  for (const dir of ['ai-providers', 'connectors', 'categories']) {
    out.push(`## ${dir}`, '');
    for (const { file, fm } of readMdDir(dir)) {
      out.push(`### ${fm.id || file} — ${nameVi(fm)}`);
      const vi = descVi(fm);
      const en = descEn(fm);
      if (vi) out.push(`- vi: ${vi}`);
      if (en) out.push(`- en: ${en}`);
      if (fm.category) out.push(`- category: ${fm.category}`);
      if (fm.keyUrl) out.push(`- keyUrl: ${fm.keyUrl}`);
      if (Array.isArray(fm.appliesTo)) out.push(`- appliesTo: ${fm.appliesTo.join(', ')}`);
      out.push('');
    }
  }

  out.push('## skills', '');
  for (const { slug, meta } of readSkillDirs('skills')) {
    out.push(`### ${slug} — ${nameVi(meta)}`);
    const vi = descVi(meta);
    const en = descEn(meta);
    if (vi) out.push(`- vi: ${vi}`);
    if (en) out.push(`- en: ${en}`);
    if (meta.category) out.push(`- category: ${meta.category}`);
    if (meta.status) out.push(`- status: ${meta.status}`);
    out.push('');
  }

  return out.join('\n');
}

// ---- emit / check ----
const targets = [
  ['llms.txt', renderRoot()],
  ['llms-full.txt', renderFull()],
  ...Object.entries(DIRS).map(([dir, cfg]) => [join(dir, 'llms.txt'), renderDirIndex(dir, cfg)]),
  ...readSkillDirs('skills').map(({ slug, meta }) => [
    join('skills', slug, 'llms.txt'),
    renderSkillIndex('skills', slug, meta),
  ]),
];

let drift = 0;
for (const [rel, content] of targets) {
  const path = join(ROOT, rel);
  let current = null;
  try {
    current = readFileSync(path, 'utf8');
  } catch {
    /* file chưa tồn tại */
  }
  if (current === content) continue;
  if (CHECK) {
    console.error(`✗ drift: ${rel}`);
    drift++;
  } else {
    writeFileSync(path, content);
    console.log(`✓ wrote ${rel}`);
  }
}

if (CHECK) {
  if (drift) {
    console.error(`\n${drift} file lệch. Chạy \`npm run build:llms\` rồi commit.`);
    process.exit(1);
  }
  console.log('llms.txt đồng bộ với nội dung nguồn.');
} else {
  console.log('Xong.');
}
