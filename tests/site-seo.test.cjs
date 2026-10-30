const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.join(__dirname, "..");
const BASE_URL = "https://gllr-spirit.github.io/Calcora/";

function walkHtml(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === ".git" || entry.name === "node_modules") return [];
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walkHtml(fullPath);
    return entry.isFile() && entry.name.endsWith(".html") ? [fullPath] : [];
  });
}

function getAttribute(tag, name) {
  const match = tag.match(new RegExp("\\b" + name + "\\s*=\\s*([\"'])(.*?)\\1", "i"));
  return match ? match[2] : null;
}

function decodeEntities(value) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function expectedCanonical(relativePath) {
  if (relativePath === "index.html") return BASE_URL;
  if (relativePath.endsWith("/index.html")) {
    return BASE_URL + relativePath.slice(0, -"/index.html".length) + "/";
  }
  return BASE_URL + relativePath;
}

function findMetaTags(html, attribute, value) {
  return [...html.matchAll(/<meta\b[^>]*>/gi)]
    .map((match) => match[0])
    .filter((tag) => getAttribute(tag, attribute) === value);
}

test("every published HTML page has one canonical URL and complete Open Graph metadata", () => {
  const pages = walkHtml(ROOT);
  assert.ok(pages.length >= 56, "The site-wide SEO audit must cover all 56 current HTML pages");

  const canonicalOwners = new Map();

  for (const file of pages) {
    const relative = path.relative(ROOT, file).split(path.sep).join("/");
    const html = fs.readFileSync(file, "utf8");
    const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
    const descriptionTags = findMetaTags(html, "name", "description");
    const description = descriptionTags.length === 1 ? getAttribute(descriptionTags[0], "content") : null;
    const canonicalTags = [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => match[0])
      .filter((tag) => (getAttribute(tag, "rel") || "").toLowerCase().split(/\s+/).includes("canonical"));
    const expected = expectedCanonical(relative);

    assert.ok(title, relative + " must have a non-empty title");
    assert.equal(descriptionTags.length, 1, relative + " must have exactly one meta description");
    assert.ok(description && description.trim(), relative + " must have a non-empty meta description");
    assert.equal(canonicalTags.length, 1, relative + " must have exactly one canonical link");
    assert.equal(getAttribute(canonicalTags[0], "href"), expected, relative + " has an incorrect canonical URL");

    assert.equal(canonicalOwners.has(expected), false, "Canonical URL is duplicated by " + relative);
    canonicalOwners.set(expected, relative);

    const ogTitle = findMetaTags(html, "property", "og:title");
    const ogDescription = findMetaTags(html, "property", "og:description");
    const ogType = findMetaTags(html, "property", "og:type");
    const ogUrl = findMetaTags(html, "property", "og:url");
    const ogSiteName = findMetaTags(html, "property", "og:site_name");

    for (const [name, tags] of [
      ["og:title", ogTitle],
      ["og:description", ogDescription],
      ["og:type", ogType],
      ["og:url", ogUrl],
      ["og:site_name", ogSiteName]
    ]) {
      assert.equal(tags.length, 1, relative + " must have exactly one " + name);
      assert.ok(getAttribute(tags[0], "content"), relative + " has an empty " + name);
    }

    assert.equal(decodeEntities(getAttribute(ogTitle[0], "content")), decodeEntities(title), relative + " og:title must match the document title");
    assert.equal(decodeEntities(getAttribute(ogDescription[0], "content")), decodeEntities(description), relative + " og:description must match the meta description");
    assert.equal(getAttribute(ogType[0], "content"), "website", relative + " og:type must be website");
    assert.equal(getAttribute(ogUrl[0], "content"), expected, relative + " og:url must match its canonical URL");
    assert.equal(getAttribute(ogSiteName[0], "content"), "Calcora", relative + " og:site_name must identify Calcora");
  }
});

