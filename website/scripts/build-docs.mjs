import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const scriptsDir = path.dirname(__filename);
const websiteDir = path.resolve(scriptsDir, '..');
const repoRoot = path.resolve(websiteDir, '..');
const docsDir = path.resolve(websiteDir, process.env.DOCS_DIR ?? '../docs');
const outputDocsDir = path.join(websiteDir, 'docs');
const syncedAssetsDir = path.join(websiteDir, 'static', 'img', 'synced');
const repoBlobBase = 'https://github.com/twinapse/scicon/blob/main';

const publishedDocs = [
  {name: 'overview', sidebarLabel: 'Overview'},
  {name: 'init', sidebarLabel: 'Repository bootstrap'},
  {name: 'package-schema', sidebarLabel: 'Package schema'},
  {name: 'validation', sidebarLabel: 'Validation'},
  {name: 'mcp-server', sidebarLabel: 'MCP server'},
  {name: 'protocol', sidebarLabel: 'SCP protocol specification'},
  {name: 'glossary', sidebarLabel: 'Glossary'},
];

const publishedDocNames = new Set(publishedDocs.map((doc) => doc.name));
const copiedAssetSources = new Map();

await prepareOutputDirectories();

const writtenDocs = [];

for (const [index, doc] of publishedDocs.entries()) {
  const sourcePath = path.join(docsDir, `${doc.name}.md`);
  const rawContent = await fs.readFile(sourcePath, 'utf8');
  const strippedContent = stripHandWrittenToc(rawContent);
  const contentWithAssets = await rewriteAssetReferences(
      strippedContent,
      sourcePath,
  );
  const rewrittenContent = rewriteMarkdownLinks(contentWithAssets, sourcePath);
  const withFrontMatter = injectFrontMatter({
    content: rewrittenContent,
    sidebarLabel: doc.sidebarLabel,
    sidebarPosition: index + 1,
  });
  const outputPath = path.join(outputDocsDir, `${doc.name}.md`);
  await fs.writeFile(outputPath, withFrontMatter, 'utf8');
  writtenDocs.push(path.relative(websiteDir, outputPath));
}

console.log(
    `Generated ${writtenDocs.length} docs in ${path.relative(repoRoot, outputDocsDir)}.`,
);
for (const docPath of writtenDocs) {
  console.log(`- ${docPath}`);
}

async function prepareOutputDirectories() {
  await fs.rm(outputDocsDir, {recursive: true, force: true});
  await fs.rm(syncedAssetsDir, {recursive: true, force: true});
  await fs.mkdir(outputDocsDir, {recursive: true});
  await fs.mkdir(syncedAssetsDir, {recursive: true});
}

function stripHandWrittenToc(markdown) {
  const marker = '<!-- toc -->';
  const markerIndex = markdown.indexOf(marker);
  if (markerIndex === -1) {
    return markdown;
  }

  const firstSectionIndex = markdown.indexOf('\n## ', markerIndex);
  if (firstSectionIndex === -1) {
    return markdown.slice(0, markerIndex).trimEnd() + '\n';
  }

  const before = markdown.slice(0, markerIndex).trimEnd();
  const after = markdown.slice(firstSectionIndex).trimStart();
  return `${before}\n\n${after}`;
}

async function rewriteAssetReferences(markdown, sourcePath) {
  let rewritten = markdown;

  for (const match of markdown.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)) {
    const original = match[0];
    const altText = match[1];
    const target = match[2].trim();
    const rewrittenTarget = await rewriteAssetTarget(target, sourcePath);
    if (rewrittenTarget === target) {
      continue;
    }

    rewritten = rewritten.replace(original, `![${altText}](${rewrittenTarget})`);
  }

  for (const match of markdown.matchAll(/<img\b([^>]*?)\bsrc=(["'])([^"']+)\2([^>]*)>/g)) {
    const original = match[0];
    const beforeSrc = match[1];
    const quote = match[2];
    const target = match[3].trim();
    const afterSrc = match[4];
    const rewrittenTarget = await rewriteAssetTarget(target, sourcePath);
    if (rewrittenTarget === target) {
      continue;
    }

    const rewrittenTag = `<img${beforeSrc}src=${quote}${rewrittenTarget}${quote}${afterSrc}>`;
    rewritten = rewritten.replace(original, rewrittenTag);
  }

  return rewritten;
}

async function rewriteAssetTarget(target, sourcePath) {
  if (!isRelativePath(target)) {
    return target;
  }

  const parts = splitTarget(target);
  const resolvedSource = path.resolve(path.dirname(sourcePath), parts.pathPart);
  const sourceStat = await safeStat(resolvedSource);
  if (!sourceStat || !sourceStat.isFile()) {
    throw new Error(
        `Unable to find referenced asset ${parts.pathPart} from ${path.relative(repoRoot, sourcePath)}.`,
    );
  }

  const destinationName = path.basename(resolvedSource);
  const previousSource = copiedAssetSources.get(destinationName);
  if (previousSource && previousSource !== resolvedSource) {
    throw new Error(
        `Asset name collision for ${destinationName}: ${path.relative(repoRoot, previousSource)} and ${path.relative(repoRoot, resolvedSource)}.`,
    );
  }

  copiedAssetSources.set(destinationName, resolvedSource);
  const destinationPath = path.join(syncedAssetsDir, destinationName);
  await fs.copyFile(resolvedSource, destinationPath);

  return `/scicon/img/synced/${destinationName}${parts.suffix}`;
}

function rewriteMarkdownLinks(markdown, sourcePath) {
  return markdown.replace(/(?<!!)\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, rawTarget) => {
    const target = rawTarget.trim();
    const rewrittenTarget = rewriteLinkTarget(target, sourcePath);
    return `[${label}](${rewrittenTarget})`;
  });
}

function rewriteLinkTarget(target, sourcePath) {
  if (!isRelativePath(target)) {
    return target;
  }

  const parts = splitTarget(target);
  const resolvedPath = path.resolve(path.dirname(sourcePath), parts.pathPart);

  if (path.extname(resolvedPath) !== '.md') {
    return target;
  }

  const relativeToDocs = path.relative(docsDir, resolvedPath);
  if (!relativeToDocs.startsWith('..') && publishedDocNames.has(path.basename(resolvedPath, '.md'))) {
    return `./${path.basename(resolvedPath)}${parts.suffix}`;
  }

  const relativeToRepo = path.relative(repoRoot, resolvedPath);
  if (relativeToRepo.startsWith('..')) {
    return target;
  }

  return `${repoBlobBase}/${toPosixPath(relativeToRepo)}${parts.suffix}`;
}

function injectFrontMatter({content, sidebarLabel, sidebarPosition}) {
  const frontMatter = [
    '---',
    `sidebar_position: ${sidebarPosition}`,
    `sidebar_label: ${JSON.stringify(sidebarLabel)}`,
    '---',
    '',
  ].join('\n');

  return `${frontMatter}${content.trimStart()}`;
}

function splitTarget(target) {
  const hashIndex = target.indexOf('#');
  const queryIndex = target.indexOf('?');
  let splitIndex = -1;

  if (hashIndex !== -1 && queryIndex !== -1) {
    splitIndex = Math.min(hashIndex, queryIndex);
  } else {
    splitIndex = Math.max(hashIndex, queryIndex);
  }

  if (splitIndex === -1) {
    return {pathPart: target, suffix: ''};
  }

  return {
    pathPart: target.slice(0, splitIndex),
    suffix: target.slice(splitIndex),
  };
}

function isRelativePath(target) {
  return !(
    target.startsWith('#')
    || target.startsWith('/')
    || target.startsWith('http://')
    || target.startsWith('https://')
    || target.startsWith('mailto:')
    || target.startsWith('tel:')
    || target.startsWith('pathname://')
    || target.startsWith('data:')
  );
}

async function safeStat(targetPath) {
  try {
    return await fs.stat(targetPath);
  } catch {
    return null;
  }
}

function toPosixPath(targetPath) {
  return targetPath.split(path.sep).join('/');
}
