const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();

function listHtmlFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === ".git" || entry.name === "node_modules") return [];
      return listHtmlFiles(fullPath);
    }
    return entry.isFile() && entry.name.endsWith(".html") ? [fullPath] : [];
  });
}

function resolveLocalTarget(sourceFile, rawUrl) {
  const value = rawUrl.trim();
  if (!value || value.startsWith("#") || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value)) return null;

  let pathname = value.split("#", 1)[0].split("?", 1)[0];
  if (!pathname) return null;

  try {
    pathname = decodeURIComponent(pathname);
  } catch {
    // Keep the original path; a malformed local URL should fail the existence check.
  }

  const target = pathname.startsWith("/")
    ? path.join(root, pathname.slice(1))
    : path.resolve(path.dirname(sourceFile), pathname);

  if (fs.existsSync(target)) {
    const stat = fs.statSync(target);
    if (stat.isDirectory()) {
      const indexFile = path.join(target, "index.html");
      return fs.existsSync(indexFile) && fs.statSync(indexFile).isFile() ? indexFile : target;
    }
    return stat.isFile() ? target : null;
  }

  // Static-site directory links may be published with an implicit index.html.
  const indexFile = path.join(target, "index.html");
  if (fs.existsSync(indexFile) && fs.statSync(indexFile).isFile()) return indexFile;
  return target;
}

test("all local HTML links and asset references point to existing files", () => {
  const htmlFiles = listHtmlFiles(root);
  const missing = [];

  for (const sourceFile of htmlFiles) {
    const html = fs.readFileSync(sourceFile, "utf8");
    const attributePattern = /\b(?:href|src)\s*=\s*(["'])(.*?)\1/gi;
    let match;

    while ((match = attributePattern.exec(html)) !== null) {
      const rawUrl = match[2].trim();
      const target = resolveLocalTarget(sourceFile, rawUrl);
      if (target && (!fs.existsSync(target) || !fs.statSync(target).isFile())) {
        missing.push({
          page: path.relative(root, sourceFile).replace(/\\/g, "/"),
          url: rawUrl,
          target: path.relative(root, target).replace(/\\/g, "/")
        });
      }
    }
  }

  assert.deepEqual(missing, [], "Broken local links or assets were found");
});


test("LMD calculator starts without invented marks and supports bounded validated backups", () => {
  const html = fs.readFileSync("education-levels/university/lmd-calculator.html", "utf8");
  const js = fs.readFileSync("assets/js/lmd-calculator.js", "utf8");
  assert.match(html, /id="export-backup"/);
  assert.match(html, /id="import-backup"/);
  assert.match(js, /const STORAGE_KEY="calcora-lmd-calculator-v1"/);
  assert.match(js, /d\.format==="calcora-lmd-backup"&&d\.version===1&&Array\.isArray\(d\.modules\)&&d\.modules\.length<=500/);
  assert.match(js, /file\.size>1024\*1024/);
  assert.doesNotMatch(js, /add\(\{name:"Algorithmique",ue:"UE Fondamentale",semester:"S1",cc:"12",exam:"14"\}\)/);
  assert.match(js, /localStorage\.getItem\(STORAGE_KEY\)/);
});


test("LMD calculator supports configurable pass threshold and ECTS credits", () => {
  const html = fs.readFileSync("education-levels/university/lmd-calculator.html", "utf8");
  const js = fs.readFileSync("assets/js/lmd-calculator.js", "utf8");
  assert.match(html, /id="pass-mark"/);
  assert.match(js, /ue-credits/);
  assert.match(js, /u\.earned=u\.average!==null&&u\.average>=passMark\?u\.credits:0/);
  assert.match(js, /Number\(m\.credits\?\?0\)>=0/);
  assert.match(js, /creditConflict/);
});
