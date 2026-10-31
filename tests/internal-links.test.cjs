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
  const math = fs.readFileSync("assets/js/lmd-math.js", "utf8");
  assert.match(math, /unit\.earned=unit\.average>=threshold\?unit\.credits:0/);
  assert.match(js, /Number\(m\.credits\?\?0\)>=0/);
  assert.match(js, /creditConflict/);
});


test("LMD low marks can be sent to revision cards without replacing existing cards", () => {
  const lmd = fs.readFileSync("assets/js/lmd-calculator.js", "utf8");
  const revision = fs.readFileSync("assets/js/revision.js", "utf8");
  assert.match(lmd, /result\.modules\.filter\(m=>m\.average<result\.passMark\)/);
  assert.match(lmd, /calcora_revision_cards_v1/);
  assert.match(lmd, /existing\.concat\(fresh\)/);
  assert.match(lmd, /window\.location\.href="\.\.\/\.\.\/revision\.html\?source=lmd&added="/);
  assert.match(lmd, /revisionLink:/);
  assert.match(revision, /fromLmd:/);
  assert.match(revision, /params\.get\("source"\)==="lmd"/);
  assert.match(revision, /calcora_revision_results_v1/);
});


test("student dashboard summarizes revision scores and per-card mistakes from existing local storage", () => {
  const dashboard = fs.readFileSync("assets/js/student-workspace.js", "utf8");
  assert.match(dashboard, /calcora_revision_results_v1/);
  assert.match(dashboard, /calcora_revision_cards_v1/);
  assert.match(dashboard, /revisionResults\.reduce\(\(a,b\)=>Number\(b\.score\)\/Number\(b\.total\)>Number\(a\.score\)\/Number\(a\.total\)\?b:a\)/);
  assert.match(dashboard, /revisionCards\.reduce\(\(sum,c\)=>sum\+Math\.max\(0,Number\(c\.mistakes\)\|\|0\),0\)/);
  assert.match(dashboard, /mistakes\.slice\(0,3\)/);
  for (const label of ["revisionProgress", "revisionMistakes", "revisionTopMistakes", "revisionBest"]) {
    assert.match(dashboard, new RegExp(label + ":"));
  }
});


test("revision cards can be tagged with an existing academic subject and remain optional", () => {
  const html = fs.readFileSync("revision.html", "utf8");
  const revision = fs.readFileSync("assets/js/revision.js", "utf8");
  assert.match(html, /id="new-subject"/);
  assert.match(revision, /calcora-student-workspace-v1/);
  assert.match(revision, /cards\.push\(\{q,a,\.\.\.\(subject\?\{subject\}:\{\}\)\}\)/);
  assert.match(revision, /subjectLabel:/);
  assert.match(revision, /c\.subject\?'<small>'/);
});

test("student dashboard connects explicitly tagged revision cards to matching subjects only", () => {
  const dashboard = fs.readFileSync("assets/js/student-workspace.js", "utf8");
  assert.match(dashboard, /subjectRevisionTitle:/);
  assert.match(dashboard, /revisionCards\.filter\(c=>typeof c\.subject==="string"&&c\.subject\.trim\(\)\)/);
  assert.match(dashboard, /x\.name\.trim\(\)\.toLocaleLowerCase\(\)===row\.name\.toLocaleLowerCase\(\)/);
  assert.match(dashboard, /subjectRevisionEmpty:/);
});


test("revision quiz results retain per-subject scores for targeted recommendations", () => {
  const revision = fs.readFileSync("assets/js/revision.js", "utf8");
  const dashboard = fs.readFileSync("assets/js/student-workspace.js", "utf8");
  assert.match(revision, /const subjectScores=\{\}/);
  assert.match(revision, /subjectScores\[key\]\.total\+\+/);
  assert.match(revision, /subjectScores\[key\]\.score\+\+/);
  assert.match(revision, /date:Date\.now\(\),subjectScores/);
  assert.match(dashboard, /recommendationLowGrade:/);
  assert.match(dashboard, /recommendationMistakes:/);
  assert.match(dashboard, /recommendationQuiz:/);
  assert.match(dashboard, /quizBySubject\.get\(row\.name\.toLocaleLowerCase\(\)\)/);
  assert.match(dashboard, /\.sort\(\(a,b\)=>b\.priority-a\.priority/);
});


test("sitemap lists every HTML page and points only to existing published targets", () => {
  const sitemap = fs.readFileSync("sitemap.xml", "utf8");
  const base = "https://gllr-spirit.github.io/Calcora/";
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  assert.ok(urls.length > 0, "Sitemap must contain URLs");
  const publishedPaths = new Set(urls.map((url) => {
    assert.ok(url.startsWith(base), "Sitemap URL must use the current GitHub Pages base");
    return decodeURIComponent(url.slice(base.length));
  }));
  for (const htmlFile of listHtmlFiles(root)) {
    const relative = path.relative(root, htmlFile).replace(/\\/g, "/");
    const expected = relative.endsWith("/index.html") || relative === "index.html"
      ? relative === "index.html" ? "" : relative.slice(0, -"/index.html".length) + "/"
      : relative;
    assert.ok(publishedPaths.has(expected), "Missing from sitemap: " + relative);
  }
  for (const published of publishedPaths) {
    const normalized = (published.endsWith("/") ? published.slice(0, -1) : published) || "index.html";
    const target = path.join(root, normalized);
    const indexFile = path.join(target, "index.html");
    assert.ok(fs.existsSync(target) && fs.statSync(target).isFile() || fs.existsSync(indexFile) && fs.statSync(indexFile).isFile(),
      "Sitemap target does not exist: " + published);
  }
});


test("all local HTML fragment links resolve to an existing id or named anchor", () => {
  const htmlFiles = listHtmlFiles(root);
  const missing = [];

  for (const sourceFile of htmlFiles) {
    const html = fs.readFileSync(sourceFile, "utf8");
    const links = html.matchAll(/<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1[^>]*>/gi);

    for (const link of links) {
      const rawUrl = link[2].trim();
      const hashIndex = rawUrl.indexOf("#");
      if (hashIndex < 0) continue;
      const rawFragment = rawUrl.slice(hashIndex + 1).split("?")[0];
      if (!rawFragment) continue;

      let fragment;
      try {
        fragment = decodeURIComponent(rawFragment);
      } catch {
        missing.push({ page: path.relative(root, sourceFile), url: rawUrl, reason: "invalid fragment encoding" });
        continue;
      }

      const rawPath = rawUrl.slice(0, hashIndex).split("?")[0];
      if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(rawPath)) continue;
      const target = rawPath ? resolveLocalTarget(sourceFile, rawPath) : sourceFile;
      if (!target || !fs.existsSync(target) || !fs.statSync(target).isFile() || !target.endsWith(".html")) continue;

      const targetHtml = fs.readFileSync(target, "utf8");
      const anchors = new Set([
        ...[...targetHtml.matchAll(/\bid\s*=\s*(["'])(.*?)\1/gi)].map(match => match[2]),
        ...[...targetHtml.matchAll(/<a\b[^>]*\bname\s*=\s*(["'])(.*?)\1[^>]*>/gi)].map(match => match[2])
      ]);
      // Study Hub creates its tool-card anchors from the tool configuration at runtime.
      if (path.basename(target) === "study-hub.html") {
        const hubScript = fs.readFileSync(path.join(root, "assets/js/study-hub.js"), "utf8");
        if (/card\.id\s*=\s*["']tool-["']\s*\+\s*tool\.id/.test(hubScript)) {
          for (const match of hubScript.matchAll(/\bid\s*:\s*["']([^"']+)["']/g)) anchors.add("tool-" + match[1]);
        }
      }
      if (!anchors.has(fragment)) {
        missing.push({
          page: path.relative(root, sourceFile).replace(/\\/g, "/"),
          url: rawUrl,
          target: path.relative(root, target).replace(/\\/g, "/"),
          fragment
        });
      }
    }
  }

  assert.deepEqual(missing, [], "Broken local HTML fragment links were found");
});


test("every published HTML page has a footer landmark", () => {
  const pages = listHtmlFiles(root);
  const missing = pages
    .map(file => ({ file, html: fs.readFileSync(file, "utf8") }))
    .filter(entry => !entry.html.toLowerCase().includes("<footer"))
    .map(entry => path.relative(root, entry.file).replace(/\\\\/g, "/"));
  assert.deepEqual(missing, [], "Pages missing a footer landmark: " + missing.join(", "));
});
