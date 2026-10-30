const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.join(__dirname, "..");

function walkHtml(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === ".git" || entry.name === "node_modules") return [];
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walkHtml(fullPath);
    return entry.isFile() && entry.name.endsWith(".html") ? [fullPath] : [];
  });
}

function attribute(tag, name) {
  const match = tag.match(new RegExp("\\b" + name + "\\s*=\\s*([\\"'])(.*?)\\1", "i"));
  return match ? match[2] : null;
}

function hasAccessibleText(value) {
  return Boolean(value && value.replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/\s+/g, " ").trim());
}

function hasAccessibleName(tag, content = "") {
  return hasAccessibleText(attribute(tag, "aria-label")) ||
    hasAccessibleText(attribute(tag, "aria-labelledby")) ||
    hasAccessibleText(content) ||
    hasAccessibleText(attribute(tag, "value")) ||
    [...content.matchAll(/<img\b[^>]*>/gi)].some((match) => hasAccessibleText(attribute(match[0], "alt")));
}

test("all published HTML pages meet baseline accessibility checks", () => {
  const pages = walkHtml(ROOT);
  assert.ok(pages.length >= 56, "The site-wide accessibility audit must cover all 56 current HTML pages");

  const issues = [];

  for (const file of pages) {
    const relative = path.relative(ROOT, file).split(path.sep).join("/");
    const html = fs.readFileSync(file, "utf8");
    const htmlTag = html.match(/<html\b[^>]*>/i)?.[0] || "";
    if (!attribute(htmlTag, "lang")) issues.push(relative + ": missing html[lang]");

    const mainCount = [...html.matchAll(/<main\b/gi)].length;
    if (mainCount !== 1) issues.push(relative + ": expected exactly one main landmark, found " + mainCount);

    const ids = new Set();
    for (const match of html.matchAll(/\bid\s*=\s*([\\"'])(.*?)\1/gi)) {
      if (ids.has(match[2])) issues.push(relative + ": duplicate id #" + match[2]);
      ids.add(match[2]);
    }

    const explicitLabels = new Set([...html.matchAll(/<label\b[^>]*\bfor\s*=\s*([\\"'])(.*?)\1[^>]*>/gi)].map((match) => match[2]));
    const labelRanges = [...html.matchAll(/<label\b[^>]*>[\s\S]*?<\/label>/gi)]
      .map((match) => ({ start: match.index, end: match.index + match[0].length }));

    for (const control of html.matchAll(/<(input|select|textarea)\b([^>]*)>/gi)) {
      const tag = control[0];
      const attrs = control[2];
      const type = (attribute(tag, "type") || "").toLowerCase();
      if (tag.startsWith("<input") && type === "hidden") continue;
      const id = attribute(tag, "id");
      const namedByAria = hasAccessibleText(attribute(tag, "aria-label")) || hasAccessibleText(attribute(tag, "aria-labelledby"));
      const namedByLabel = (id && explicitLabels.has(id)) || labelRanges.some((range) => control.index > range.start && control.index < range.end);
      const namedByValue = ["button", "submit", "reset"].includes(type) && hasAccessibleText(attribute(tag, "value"));
      if (!namedByAria && !namedByLabel && !namedByValue) {
        issues.push(relative + ": " + control[1] + (id ? "#" + id : "") + " has no accessible name");
      }
    }

    for (const button of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)) {
      if (!hasAccessibleName(button[0].slice(0, button[0].indexOf(">") + 1), button[2])) {
        issues.push(relative + ": button has no accessible name");
      }
    }

    for (const link of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
      const tag = link[0].slice(0, link[0].indexOf(">") + 1);
      if (attribute(tag, "href") !== null && !hasAccessibleName(tag, link[2])) {
        issues.push(relative + ": link " + (attribute(tag, "href") || "(empty)") + " has no accessible name");
      }
    }

    for (const image of html.matchAll(/<img\b[^>]*>/gi)) {
      if (attribute(image[0], "alt") === null) issues.push(relative + ": image is missing an alt attribute");
    }

    const resultRegions = [...html.matchAll(/<[^>]+class\s*=\s*([\\"'])[^\\"']*\bresult\b[^\\"']*\1[^>]*>/gi)];
    for (const result of resultRegions) {
      if (!/\brole\s*=\s*([\\"'])status\1/i.test(result[0]) ||
          !/\baria-live\s*=\s*([\\"'])polite\1/i.test(result[0])) {
        issues.push(relative + ": result region should announce updates with role=status and aria-live=polite");
      }
    }
  }

  assert.deepEqual(issues, [], "Accessibility issues across all HTML pages:\n" + issues.join("\n"));
});
