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

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, unlinkSync } from 'node:fs';
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
    if (f === 'llms.txt') continue;
    if (statSync(join(skillDir, f)).isDirectory()) continue; // bỏ references/ (thư mục)
    let d = SKILL_FILE_DESC[f];
    if (f === 'SKILL.md') {
      // description trong frontmatter SKILL.md = tín hiệu trigger cho agent
      d = `Instructions agent chạy — ${clip(oneLine(matter.read(join(skillDir, f)).data?.description || ''), 120)}`;
    }
    lines.push(`- [${f}](${f}): ${d || 'File của skill.'}`);
  }
  lines.push('');
  return lines.join('\n');
}

// ---- render catalog references cho skill toc-guidelines (sinh từ frontmatter) ----
// Nguồn sự thật = connectors/*.md + skills/*/_meta.json + categories/*.md.
// Thay 2 file catalog chép tay (đã drift 46↔49) bằng bản sinh — hết drift.
function loadCategories() {
  const map = {};
  for (const { fm } of readMdDir('categories')) {
    map[fm.id] = { vi: nameVi(fm), order: typeof fm.displayOrder === 'number' ? fm.displayOrder : 999 };
  }
  return map;
}
function byCategory(order) {
  return (a, b) => (order[a]?.order ?? 999) - (order[b]?.order ?? 999) || a.localeCompare(b);
}
// ví dụ end-user cho skill: giữ nguyên bullet "/slug ..." trong phần vi của README
// (giữ cả lệnh /slug — đó là cách kích hoạt, model nhỏ cần thấy để biết gõ gì).
function skillExample(slug, meta) {
  try {
    const vi = readFileSync(join(ROOT, 'skills', slug, 'README.md'), 'utf8').split('<!-- en')[0];
    const m = vi.match(/^- (\/\S+\s+.+?)\s*$/m);
    if (m) return oneLine(m[1]);
  } catch {
    /* không có README */
  }
  return descVi(meta);
}

// web_fetch in OpenClaw caps output at 20,000 chars, so every file agents fetch
// must stay below FETCH_CHAR_LIMIT; the connectors catalog is split into parts
// of at most CATALOG_PART_CHARS and indexed by connectors-catalog.md.
const FETCH_CHAR_LIMIT = 18000;
const CATALOG_PART_CHARS = 14000;
const CATALOG_DIR = 'skills/toc-guidelines/references';
const catalogPartFile = (i) => `connectors-catalog-${i + 1}.md`;

function renderConnectorsCatalog() {
  const cats = loadCategories();
  const items = readMdDir('connectors').map(({ fm }) => fm);
  const groups = {};
  for (const c of items) (groups[c.category] ||= []).push(c);

  const sections = Object.keys(groups)
    .sort(byCategory(cats))
    .map((cat) => {
      const title = cats[cat]?.vi || cat;
      const list = groups[cat].sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0) || a.id.localeCompare(b.id));
      const lines = [`## ${title}`, ''];
      for (const c of list) {
        lines.push(`### ${nameVi(c)}${c.popular ? ' ⭐' : ''}  (\`${c.id}\`)`, '');
        lines.push(`- **Dùng để làm gì**: ${descVi(c)}`);
        lines.push(`- **Ví dụ người dùng nói**: "${oneLine(c.tutorials?.[0]?.prompt?.vi || '')}"`);
        lines.push(`- **Gọi nhanh**: gõ \`@${c.id}\` trong câu nhắn.`);
        lines.push(`- **Kết nối**: mở ClawExpert → mục Connectors → chọn ${nameVi(c)} → đăng nhập/cấp quyền.`, '');
      }
      return { title, apps: list.map(nameVi), text: lines.join('\n') };
    });

  // Greedy packing in category order; a category is never split across parts.
  const parts = [];
  for (const s of sections) {
    const last = parts[parts.length - 1];
    if (last && last.size + s.text.length <= CATALOG_PART_CHARS) {
      last.sections.push(s);
      last.size += s.text.length;
    } else {
      parts.push({ sections: [s], size: s.text.length });
    }
  }

  const index = [
    '# Danh mục Connectors được hỗ trợ — mục lục',
    '',
    `> Danh mục connectors mà ClawExpert hỗ trợ (nội dung tĩnh, đóng gói sẵn trong skill). Tổng: ${items.length} connector.`,
    '> Connector API được cung cấp qua nhóm Apps (`toc-apps`) với bộ tool list/search/describe/call/stage ổn định.',
    '> Gọi `connector_list_apps` để lấy profile và trạng thái hiện tại; `tools/list` chỉ liệt kê interface. Kết nối mới qua giao diện ClawExpert (mục Connectors).',
    '',
    `Danh mục chia ${parts.length} phần theo nhóm. Chỉ lấy phần chứa nhóm/app đang hỏi; hỏi tổng quan thì lấy lần lượt từng phần.`,
    '',
    '| Nhóm | App | File |',
    '|---|---|---|',
  ];
  parts.forEach((p, i) => {
    for (const s of p.sections) index.push(`| ${s.title} | ${s.apps.join(', ')} | \`${catalogPartFile(i)}\` |`);
  });
  index.push('');

  const files = [[`${CATALOG_DIR}/connectors-catalog.md`, index.join('\n')]];
  parts.forEach((p, i) => {
    const others = parts.map((_, j) => j).filter((j) => j !== i).map((j) => `\`${catalogPartFile(j)}\``);
    const out = [
      `# Danh mục Connectors — phần ${i + 1}/${parts.length}`,
      '',
      `> Phần này gồm nhóm: ${p.sections.map((s) => s.title).join(', ')}.`,
      '',
      ...p.sections.map((s) => s.text),
      `> Không thấy app cần tìm? Còn ${others.length ? others.join(', ') : 'không phần nào khác'} — xem \`connectors-catalog.md\` để biết app nằm ở phần nào.`,
      '',
    ];
    files.push([`${CATALOG_DIR}/${catalogPartFile(i)}`, out.join('\n')]);
  });
  return files;
}

function renderSkillsCatalog() {
  const cats = loadCategories();
  const skills = readSkillDirs('skills').filter(({ meta }) => meta.is_published === true);
  const groups = {};
  for (const s of skills) (groups[s.meta.category] ||= []).push(s);
  const out = [
    '# Danh mục Skills được hỗ trợ',
    '',
    `> Danh mục skills mà ClawExpert hỗ trợ (nội dung tĩnh, đóng gói sẵn trong skill). Tổng: ${skills.length} skill.`,
    '> Skill được cài qua giao diện ClawExpert (mục Skills). Agent không gọi backend để lấy danh sách.',
    '',
  ];
  for (const cat of Object.keys(groups).sort(byCategory(cats))) {
    out.push(`## ${cats[cat]?.vi || cat}`, '');
    for (const { slug, meta } of groups[cat].sort((a, b) => a.slug.localeCompare(b.slug))) {
      out.push(`### ${nameVi(meta)}  (\`${slug}\`)`, '');
      out.push(`- **Dùng để làm gì**: ${descVi(meta)}`);
      out.push(`- **Ví dụ người dùng nói**: "${skillExample(slug, meta)}"`);
      out.push(`- **Cài đặt**: mở ClawExpert → mục Skills → tìm "${nameVi(meta)}" → Cài.`, '');
    }
  }
  return out.join('\n');
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
  // catalog references cho skill toc-guidelines (sinh từ frontmatter, hết drift)
  ...renderConnectorsCatalog(),
  [`${CATALOG_DIR}/skills-catalog.md`, renderSkillsCatalog()],
];

// Stale catalog parts left behind when the part count shrinks.
const catalogTargets = new Set(targets.map(([rel]) => rel));
const staleParts = readdirSync(join(ROOT, CATALOG_DIR))
  .filter((f) => /^connectors-catalog-\d+\.md$/.test(f))
  .map((f) => `${CATALOG_DIR}/${f}`)
  .filter((rel) => !catalogTargets.has(rel));

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

for (const rel of staleParts) {
  if (CHECK) {
    console.error(`✗ stale: ${rel}`);
    drift++;
  } else {
    unlinkSync(join(ROOT, rel));
    console.log(`✓ removed ${rel}`);
  }
}

// Files agents fetch at runtime: every skill's references/*.md, any GUIDE.md,
// and the SKILL.md of skills toc-guidelines fetches when they are not installed.
const HANDOFF_SKILLS = ['browser-extension', 'desktop-device'];
function fetchedFiles() {
  const files = [];
  for (const { slug } of readSkillDirs('skills')) {
    const dir = join('skills', slug);
    const refs = join(ROOT, dir, 'references');
    if (existsSync(refs)) {
      for (const f of readdirSync(refs).filter((f) => f.endsWith('.md')).sort()) files.push(join(dir, 'references', f));
    }
    if (existsSync(join(ROOT, dir, 'GUIDE.md'))) files.push(join(dir, 'GUIDE.md'));
    if (HANDOFF_SKILLS.includes(slug)) files.push(join(dir, 'SKILL.md'));
  }
  return files;
}
let oversize = 0;
for (const rel of fetchedFiles()) {
  const chars = [...readFileSync(join(ROOT, rel), 'utf8')].length;
  if (chars > FETCH_CHAR_LIMIT) {
    console.error(`✗ too long for web_fetch: ${rel} (${chars} > ${FETCH_CHAR_LIMIT} chars) — split it`);
    oversize++;
  }
}
if (oversize) process.exit(1);

if (CHECK) {
  if (drift) {
    console.error(`\n${drift} file lệch. Chạy \`npm run build:llms\` rồi commit.`);
    process.exit(1);
  }
  console.log('llms.txt đồng bộ với nội dung nguồn.');
} else {
  console.log('Xong.');
}
