#!/usr/bin/env node
// Validate frontmatter mọi thư mục có _schema.json (ai-providers, connectors, categories).
// Mở rộng của CI validate.yml (vốn chỉ check ai-providers) sang toàn bộ catalog.
// - id trong frontmatter phải khớp tên file
// - frontmatter phải hợp _schema.json (draft 2020-12)
// exit 1 nếu có lỗi.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIRS = ['ai-providers', 'connectors', 'categories'];

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

let errors = 0;
for (const dir of DIRS) {
  const schemaPath = join(ROOT, dir, '_schema.json');
  if (!existsSync(schemaPath)) continue;
  const validate = ajv.compile(JSON.parse(readFileSync(schemaPath, 'utf8')));

  const files = readdirSync(join(ROOT, dir))
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .sort();

  for (const f of files) {
    const id = f.replace(/\.md$/, '');
    let data;
    try {
      data = matter.read(join(ROOT, dir, f)).data;
    } catch (e) {
      console.error(`✗ ${dir}/${f}: parse lỗi — ${e.message}`);
      errors++;
      continue;
    }
    if (data.id !== id) {
      console.error(`✗ ${dir}/${f}: id '${data.id}' ≠ filename '${id}'`);
      errors++;
      continue;
    }
    if (!validate(data)) {
      console.error(`✗ ${dir}/${f}:`);
      for (const err of validate.errors) console.error(`    ${err.instancePath || '/'} ${err.message}`);
      errors++;
    }
  }
}

if (errors) {
  console.error(`\n${errors} file không hợp lệ.`);
  process.exit(1);
}
console.log('Tất cả frontmatter hợp lệ.');
