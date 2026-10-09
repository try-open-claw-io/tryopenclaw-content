#!/usr/bin/env node
// Assembles the GitHub Pages site: production (`main`) at the site root and
// staging under `/staging/`. Pages serves one site per repo and each deploy
// replaces it wholesale, so every build must contain both environments.
//
// Content keeps canonical production URLs; the published copy points them at
// the environment it is served from, so staging never fetches production docs.
//
// Usage: node scripts/build-pages.mjs <productionRoot> <stagingRoot> <outputRoot>
//        (PAGES_BASE_URL overrides the default site URL)

import { copyFile, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_BASE_URL = 'https://try-open-claw-io.github.io/tryopenclaw-content';
const PUBLIC_DIRS = ['agent-templates', 'ai-providers', 'categories', 'connectors', 'skills'];
const PUBLIC_FILES = ['README.md', 'llms.txt', 'llms-full.txt'];
const TEXT_EXTENSIONS = new Set(['.md', '.txt']);
// Keep in sync with be/.../steps/platform-guidelines.ts (CATALOG_URL_PATTERN).
const CATALOG_URL_PATTERN =
  /https:\/\/(?:raw\.githubusercontent\.com\/try-open-claw-io\/tryopenclaw-content\/(?:main|staging)|try-open-claw-io\.github\.io\/tryopenclaw-content(?:\/staging)?)\//g;

function isWithin(parent, child) {
  const path = relative(parent, child);
  return !isAbsolute(path) && path !== '..' && !path.startsWith(`..${sep}`);
}

async function publishFile(source, target, catalogBaseUrl) {
  if (!TEXT_EXTENSIONS.has(extname(source).toLowerCase())) {
    await copyFile(source, target);
    return;
  }
  const text = await readFile(source, 'utf8');
  await writeFile(target, text.replace(CATALOG_URL_PATTERN, catalogBaseUrl));
}

// Hidden entries and symlinks are never published: only tracked catalog files.
async function publishDir(source, target, catalogBaseUrl) {
  await mkdir(target, { recursive: true });
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const from = join(source, entry.name);
    const to = join(target, entry.name);
    if (entry.isDirectory()) await publishDir(from, to, catalogBaseUrl);
    else if (entry.isFile()) await publishFile(from, to, catalogBaseUrl);
  }
}

async function publishEnvironment(sourceRoot, targetRoot, catalogBaseUrl) {
  await mkdir(targetRoot, { recursive: true });
  for (const dir of PUBLIC_DIRS) {
    await publishDir(join(sourceRoot, dir), join(targetRoot, dir), catalogBaseUrl);
  }
  for (const file of PUBLIC_FILES) {
    await publishFile(join(sourceRoot, file), join(targetRoot, file), catalogBaseUrl);
  }
}

export async function buildPages({ productionRoot, stagingRoot, outputRoot, baseUrl = DEFAULT_BASE_URL }) {
  const output = resolve(outputRoot);
  for (const root of [productionRoot, stagingRoot]) {
    if (isWithin(output, resolve(root))) {
      throw new Error(`Output ${outputRoot} must not contain the source ${root}`);
    }
  }
  const siteUrl = baseUrl.replace(/\/+$/, '');

  await rm(output, { recursive: true, force: true });
  await publishEnvironment(productionRoot, output, `${siteUrl}/`);
  await publishEnvironment(stagingRoot, join(output, 'staging'), `${siteUrl}/staging/`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [productionRoot, stagingRoot, outputRoot] = process.argv.slice(2);
  if (!productionRoot || !stagingRoot || !outputRoot) {
    console.error('Usage: node scripts/build-pages.mjs <productionRoot> <stagingRoot> <outputRoot>');
    process.exit(1);
  }
  await buildPages({
    productionRoot,
    stagingRoot,
    outputRoot,
    baseUrl: process.env.PAGES_BASE_URL || DEFAULT_BASE_URL,
  });
  console.log(`Pages site assembled in ${outputRoot} (production at /, staging at /staging/).`);
}
