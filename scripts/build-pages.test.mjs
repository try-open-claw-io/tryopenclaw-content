import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, before, test } from 'node:test';

import { buildPages } from './build-pages.mjs';

const RAW_MAIN = 'https://raw.githubusercontent.com/try-open-claw-io/tryopenclaw-content/main/';
const PAGES = 'https://try-open-claw-io.github.io/tryopenclaw-content/';
const SITE = 'https://pages.example.com/content';
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, ...Buffer.from(RAW_MAIN)]);

let workspace;
let output;

async function put(root, path, content) {
  await mkdir(dirname(join(root, path)), { recursive: true });
  await writeFile(join(root, path), content);
}

async function createBranch(root, label) {
  for (const dir of ['agent-templates', 'ai-providers', 'categories', 'connectors']) {
    await put(root, `${dir}/llms.txt`, `${label} ${dir}\n`);
  }
  await put(root, 'README.md', `# ${label}\n`);
  await put(root, 'llms.txt', `${label} index ${RAW_MAIN}skills/llms.txt\n`);
  await put(root, 'llms-full.txt', `${label} full\n`);
  await put(root, 'skills/toc-guidelines/SKILL.md', [
    `${label} guide ${RAW_MAIN}skills/toc-guidelines/GUIDE.md`,
    `pages ${PAGES}llms-full.txt`,
    `staged ${PAGES}staging/skills/llms.txt`,
    'preview https://raw.githubusercontent.com/try-open-claw-io/tryopenclaw-content/feat-x/llms.txt',
    'external https://docs.github.com/en/pages',
    'relative [ref](references/setup.md)',
  ].join('\n'));
  await put(root, 'skills/toc-guidelines/_meta.json', `{"label":"${label}"}`);
  await put(root, 'skills/toc-guidelines/logo.png', PNG);
  await put(root, 'skills/.DS_Store', 'hidden');
  await put(root, 'scripts/build-llms.mjs', 'tooling');
  await put(root, '.github/workflows/pages.yml', 'workflow');
  await put(root, 'CLAUDE.md', 'agent notes');
}

const read = (path) => readFile(join(output, path), 'utf8');
const exists = (path) => stat(join(output, path)).then(() => true, () => false);

before(async () => {
  workspace = await mkdtemp(join(tmpdir(), 'build-pages-'));
  output = join(workspace, 'public');
  await createBranch(join(workspace, 'production'), 'PRODUCTION');
  await createBranch(join(workspace, 'staging'), 'STAGING');
  await buildPages({
    productionRoot: join(workspace, 'production'),
    stagingRoot: join(workspace, 'staging'),
    outputRoot: output,
    baseUrl: `${SITE}/`,
  });
});

after(() => rm(workspace, { recursive: true, force: true }));

test('production is served at the root and staging under /staging/', async () => {
  assert.match(await read('README.md'), /^# PRODUCTION/);
  assert.match(await read('staging/README.md'), /^# STAGING/);
  assert.match(await read('connectors/llms.txt'), /^PRODUCTION/);
  assert.match(await read('staging/connectors/llms.txt'), /^STAGING/);
  assert.equal(await read('staging/skills/toc-guidelines/_meta.json'), '{"label":"STAGING"}');
});

test('catalog links point at the environment each copy is served from', async () => {
  const production = await read('skills/toc-guidelines/SKILL.md');
  const staging = await read('staging/skills/toc-guidelines/SKILL.md');

  assert.match(production, new RegExp(`guide ${SITE}/skills/toc-guidelines/GUIDE\\.md`));
  assert.match(production, new RegExp(`staged ${SITE}/skills/llms\\.txt`));
  assert.match(staging, new RegExp(`guide ${SITE}/staging/skills/toc-guidelines/GUIDE\\.md`));
  assert.match(staging, new RegExp(`pages ${SITE}/staging/llms-full\\.txt`));
  assert.match(staging, new RegExp(`staged ${SITE}/staging/skills/llms\\.txt`));
  assert.equal(await read('staging/llms.txt'), `STAGING index ${SITE}/staging/skills/llms.txt\n`);
  for (const text of [production, staging]) {
    assert.doesNotMatch(text, /raw\.githubusercontent\.com\/try-open-claw-io\/tryopenclaw-content\/main\//);
    assert.doesNotMatch(text, /\/staging\/staging\//);
  }
});

test('non-catalog links and binary assets are published unchanged', async () => {
  const staging = await read('staging/skills/toc-guidelines/SKILL.md');

  assert.match(staging, /tryopenclaw-content\/feat-x\/llms\.txt/);
  assert.match(staging, /external https:\/\/docs\.github\.com\/en\/pages/);
  assert.match(staging, /relative \[ref\]\(references\/setup\.md\)/);
  assert.deepEqual(await readFile(join(output, 'staging/skills/toc-guidelines/logo.png')), PNG);
});

test('repository tooling and hidden files are not published', async () => {
  for (const prefix of ['', 'staging/']) {
    for (const path of ['scripts', '.github', 'CLAUDE.md', 'skills/.DS_Store']) {
      assert.equal(await exists(`${prefix}${path}`), false, `${prefix}${path} must not be published`);
    }
  }
});

test('refuses an output directory that would delete a source branch', async () => {
  const productionRoot = join(workspace, 'production');
  await assert.rejects(
    buildPages({ productionRoot, stagingRoot: join(workspace, 'staging'), outputRoot: workspace }),
    /must not contain the source/,
  );
  assert.equal(await readFile(join(productionRoot, 'README.md'), 'utf8'), '# PRODUCTION\n');
});
