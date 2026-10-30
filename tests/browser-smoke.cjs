const assert = require("node:assert/strict");
const fs = require("node:fs");
const { chromium } = require("playwright");

const base = (process.env.SITE_URL || "https://gllr-spirit.github.io/Calcora/").replace(/\/$/, "") + "/";
const failures = [];
const pageErrors = [];
const internalLinks = new Set();

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
  page.on("pageerror", error => pageErrors.push({ url: page.url(), message: error.message }));

  try {
    const sitemapResponse = await page.request.get(new URL("sitemap.xml", base).href);
    assert.equal(sitemapResponse.status(), 200, "sitemap.xml should be reachable");
    const sitemap = await sitemapResponse.text();
    const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1].trim());
    assert.ok(urls.length >= 40, "sitemap should cover the site's HTML pages");

    for (const url of urls) {
      try {
        const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
        if (!response || response.status() !== 200) {
          failures.push(url + " returned HTTP " + (response ? response.status() : "no response"));
          continue;
        }
        await page.waitForLoadState("networkidle", { timeout: 4000 }).catch(() => {});
        const title = await page.title();
        const bodyText = (await page.locator("body").innerText().catch(() => "")).trim();
        const description = (await page.locator('meta[name="description"]').getAttribute("content").catch(() => "")) || "";
        if (!title.trim()) failures.push(url + " has an empty document title");
        if (!description.trim()) failures.push(url + " has no meta description");
        if (bodyText.length < 15) failures.push(url + " has almost no visible page content");

        const links = await page.locator("a[href]").evaluateAll(nodes => nodes.map(a => ({
          href: a.href,
          label: (a.innerText || a.getAttribute("aria-label") || "").trim(),
          isCard: a.classList.contains("card")
        })));
        for (const link of links) {
          if (link.isCard && (!link.label || !link.href)) failures.push(url + " has a card without a label or destination");
          try {
            const target = new URL(link.href);
            if (target.origin === new URL(base).origin && target.pathname.startsWith(new URL(base).pathname) && !target.hash) {
              internalLinks.add(target.href);
            }
          } catch {}
        }
      } catch (error) {
        failures.push(url + " navigation failed: " + error.message);
      }
    }

    for (const href of internalLinks) {
      try {
        const response = await page.request.get(href, { timeout: 10000 });
        if (response.status() !== 200) failures.push(href + " returned HTTP " + response.status());
      } catch (error) {
        failures.push(href + " link check failed: " + error.message);
      }
    }

    await page.goto(base, { waitUntil: "domcontentloaded" });
    await page.locator("#language-select").selectOption("fr");
    await page.waitForFunction(() => document.documentElement.lang === "fr");
    assert.match(await page.title(), /Calculatrices pour tous/, "French language switch should update the page title");

    const originalTheme = await page.locator("html").getAttribute("data-theme");
    await page.locator("#theme-toggle").click();
    assert.notEqual(await page.locator("html").getAttribute("data-theme"), originalTheme, "theme toggle should change the theme");

    await page.locator("#tool-search").fill("calcora-browser-test-no-match");
    assert.equal(await page.locator(".tool-card:visible").count(), 0, "search should filter all non-matching tool cards");
    await page.locator("#tool-search").fill("");
    await page.locator('.discovery-filter[data-category="education"]').click();
    assert.equal(await page.locator('.discovery-filter[data-category="education"]').getAttribute("aria-pressed"), "true", "category filter should activate");

    const faqUrl = new URL("pages/faq.html", base).href;
    await page.goto(faqUrl, { waitUntil: "domcontentloaded" });
    assert.equal(await page.locator("details.faq-item").count(), 8, "FAQ should display all eight questions");
    await page.locator("#language-select").selectOption("fr");
    assert.equal((await page.locator('[data-f="q1"]').innerText()).trim(), "Calcora est-il gratuit ?", "FAQ language switch should translate questions");
    await page.locator("details.faq-item").first().locator("summary").click();
    assert.equal(await page.locator("details.faq-item").first().evaluate(el => el.open), true, "FAQ accordion should open");

    // Exercise real calculator forms and verify their displayed results.
    await page.goto(new URL("calculators/algeria/grades.html", base).href, { waitUntil: "domcontentloaded" });
    await page.locator("#calc-type").selectOption("weighted");
    await page.locator(".grade-row").nth(0).locator(".mark").fill("12");
    await page.locator(".grade-row").nth(0).locator(".coef").fill("2");
    await page.locator(".grade-row").nth(1).locator(".mark").fill("14");
    await page.locator(".grade-row").nth(1).locator(".coef").fill("3");
    await page.locator("#calculate").click();
    assert.match(await page.locator("#result").innerText(), /13,20/, "weighted grade average should calculate to 13.20");
    await page.locator("#calc-type").selectOption("year");
    await page.locator("#semester1").fill("12");
    await page.locator("#semester2").fill("14");
    await page.locator("#calculate").click();
    assert.match(await page.locator("#result").innerText(), /13,00/, "annual average should calculate to 13.00");

    await page.goto(new URL("calculators/science/measurements.html", base).href, { waitUntil: "domcontentloaded" });
    await page.locator("#area-form button[type=submit]").click();
    assert.match(await page.locator("#area-result").innerText(), /16/, "square area should calculate from default side length");
    await page.locator("#volume-shape").selectOption("box");
    await page.locator("#volume-form button[type=submit]").click();
    assert.ok((await page.locator("#volume-result").innerText()).trim().length > 0, "volume calculator should show a result");
    await page.locator("#speed-form button[type=submit]").click();
    assert.match(await page.locator("#speed-result").innerText(), /5/, "speed calculator should return 5 m/s");
    await page.locator("#acceleration-form button[type=submit]").click();
    assert.match(await page.locator("#acceleration-result").innerText(), /5/, "acceleration calculator should return 5 m/s²");

    await page.goto(new URL("calculators/math/percentage.html", base).href, { waitUntil: "domcontentloaded" });
    await page.locator("#pct button").click();
    assert.match(await page.locator("#pct-result").innerText(), /30/, "15 percent of 200 should be 30");
    await page.goto(new URL("calculators/conversions/units.html", base).href, { waitUntil: "domcontentloaded" });
    await page.locator("#amount").fill("1");
    await page.locator("#from").selectOption("km");
    await page.locator("#to").selectOption("m");
    await page.locator("#units-form button").click();
    assert.match((await page.locator("#units-result").innerText()).replace(/[\s\u202f]/g, ""), /1000/, "one kilometre should convert to 1000 metres");

    await page.goto(new URL("education-levels/university/lmd-calculator.html", base).href, { waitUntil: "domcontentloaded" });
    const moduleRow = page.locator(".module-row").first();
    await moduleRow.locator(".module-name").fill("Algorithms");
    await moduleRow.locator(".ue-name").fill("Computer Science");
    await moduleRow.locator(".semester-select").selectOption("S1");
    await moduleRow.locator(".cc-mark").fill("12");
    await moduleRow.locator(".exam-mark").fill("16");
    await moduleRow.locator(".cc-weight").fill("1");
    await moduleRow.locator(".exam-weight").fill("1");
    await moduleRow.locator(".module-coeff").fill("1");
    await moduleRow.locator(".ue-coeff").fill("1");
    await page.locator("#calculate").click();
    assert.match(await page.locator("#results").innerText(), /14,00/, "LMD calculator should compute a module average of 14.00");

    // Confirm study plans and exam dates survive a real page reload.
    await page.goto(new URL("study-planner.html", base).href, { waitUntil: "domcontentloaded" });
    await page.locator("#task-subject").fill("Calcora persistence smoke test");
    await page.locator("#task-date").fill("2099-12-01");
    await page.locator("#study-form button[type=submit]").click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("calcora-study-planner-v1") || "null")?.plans?.some(p => p.subject === "Calcora persistence smoke test"));
    await page.reload({ waitUntil: "domcontentloaded" });
    assert.match(await page.locator("#plan-list").innerText(), /Calcora persistence smoke test/, "saved revision plan should reappear after reload");

    await page.goto(new URL("exam-planner.html", base).href, { waitUntil: "domcontentloaded" });
    await page.locator("#exam-name").fill("Calcora exam persistence smoke test");
    await page.locator("#exam-date").fill("2099-12-01");
    await page.locator("#exam-form button[type=submit]").click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("calcora-exam-countdown-v1") || "[]").some(e => e.name === "Calcora exam persistence smoke test"));
    await page.reload({ waitUntil: "domcontentloaded" });
    assert.match(await page.locator("#exam-list").innerText(), /Calcora exam persistence smoke test/, "saved exam should reappear after reload");


    // Test the newly published Learning Lab controls and capture desktop/mobile layouts.
    await page.setViewportSize({ width: 1365, height: 900 });
    await page.goto(new URL("learning-lab.html", base).href, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 4000 }).catch(() => {});
    assert.equal(await page.locator("#equations").count(), 1, "equation solver section should exist");
    assert.equal(await page.locator("#algorithms").count(), 1, "algorithm visualizer section should exist");
    assert.equal(await page.locator("#playground").count(), 1, "code playground section should exist");
    await page.screenshot({ path: "artifacts/learning-lab-desktop.png", fullPage: true });
    await page.locator("#solve-equation").click();
    assert.match(await page.locator("#equation-result").innerText(), /x = 3/, "linear equation 2x - 6 = 0 should solve to x=3");
    await page.locator("#equation-type").selectOption("quadratic");
    await page.locator("#coef-a").fill("1");
    await page.locator("#coef-b").fill("-3");
    await page.locator("#coef-c").fill("2");
    await page.locator("#solve-equation").click();
    assert.match(await page.locator("#equation-result").innerText(), /x₁ = 2, x₂ = 1|x₁ = 2.*x₂ = 1/, "x² - 3x + 2 should have roots 2 and 1");
    await page.locator("#algorithm-start").click();
    assert.equal(await page.locator(".algorithm-bar").count(), 6, "algorithm visualizer should render all input values");
    await page.locator("#algorithm-step").click();
    assert.ok((await page.locator("#algorithm-status").innerText()).length > 0, "algorithm step should update status");
    await page.locator("#run-code").click();
    await page.waitForFunction(() => !document.querySelector("#run-code").disabled, { timeout: 3000 });
    assert.match(await page.locator("#code-output").innerText(), /Sum: 22/, "JavaScript playground should capture console output");
    await page.waitForTimeout(1600);
    await page.locator("#code-input").fill('console.log("fetch:", typeof fetch); console.log("XHR:", typeof XMLHttpRequest); return 9007199254740993n;');
    await page.locator("#run-code").click();
    await page.waitForFunction(() => !document.querySelector("#run-code").disabled, { timeout: 3000 });
    const restrictedOutput = await page.locator("#code-output").innerText();
    assert.match(restrictedOutput, /fetch: undefined/, "playground worker should disable direct fetch access");
    assert.match(restrictedOutput, /XHR: undefined/, "playground worker should disable XMLHttpRequest");
    assert.match(restrictedOutput, /9007199254740993n/, "playground should safely display BigInt results");
    await page.waitForTimeout(1600);
    await page.locator("#code-input").fill('for (let i = 0; i < 60; i++) console.log("x".repeat(100), i);');
    await page.locator("#run-code").click();
    await page.waitForFunction(() => !document.querySelector("#run-code").disabled, { timeout: 3000 });
    assert.ok((await page.locator("#code-output").innerText()).length <= 2600, "playground output should remain capped");

    await page.locator("#language-select").selectOption("en");
    await page.locator("#formula-search").fill("binary");
    assert.equal(await page.locator(".formula-card").count(), 1, "formula search should filter to binary search");
    await page.locator("#converter-category").selectOption("pressure");
    await page.locator("#converter-value").fill("1");
    await page.locator("#converter-from").selectOption("bar");
    await page.locator("#converter-to").selectOption("kPa");
    await page.locator("#convert-advanced").click();
    assert.match(await page.locator("#advanced-converter-result").innerText(), /100/, "one bar should convert to 100 kPa");
    await page.locator("#converter-category").selectOption("base");
    await page.locator("#converter-value").fill("9007199254740993");
    await page.locator("#converter-from").selectOption("10");
    await page.locator("#converter-to").selectOption("16");
    await page.locator("#convert-advanced").click();
    assert.match(await page.locator("#advanced-converter-result").innerText(), /20000000000001/i, "large integer base conversion should preserve precision beyond Number.MAX_SAFE_INTEGER");
    await page.locator("#converter-value").fill("-255");
    await page.locator("#converter-from").selectOption("10");
    await page.locator("#converter-to").selectOption("16");
    await page.locator("#convert-advanced").click();
    assert.match(await page.locator("#advanced-converter-result").innerText(), /-FF/i, "negative integer base conversion should preserve its sign");
    await page.locator("#citation-author").fill("Doe, Jane");
    await page.locator("#citation-year").fill("2025");
    await page.locator("#citation-title").fill("Testing Learning Tools");
    await page.locator("#citation-publisher").fill("Calcora");
    await page.locator("#citation-url").fill("https://example.org");
    await page.locator("#make-citation").click();
    assert.match(await page.locator("#citation-result").innerText(), /Testing Learning Tools/, "citation helper should format entered title");
    assert.equal(await page.evaluate(() => !!window.PDFLib), false, "PDF library should not load during initial page startup");
    await page.waitForFunction(() => typeof window.CALCORA_LOAD_PDF_LIBRARY === "function");
    await page.evaluate(() => window.CALCORA_LOAD_PDF_LIBRARY());
    await page.waitForFunction(() => !!window.PDFLib, { timeout: 8000 });
    const samplePdfBytes = await page.evaluate(async () => {
      const doc = await window.PDFLib.PDFDocument.create();
      doc.addPage([300, 400]);
      doc.addPage([300, 400]);
      return Array.from(await doc.save());
    });
    const sampleBuffer = Buffer.from(samplePdfBytes);
    await page.locator("#pdf-files").setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("not a PDF") });
    await page.locator("#process-pdf").click();
    assert.match(await page.locator("#pdf-status").innerText(), /valid PDF files/i, "PDF tool should reject non-PDF files");
    await page.locator("#pdf-files").setInputFiles(Array.from({ length: 9 }, (_, i) => ({ name: "sample-" + i + ".pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4") })));
    await page.locator("#process-pdf").click();
    assert.match(await page.locator("#pdf-status").innerText(), /no more than 8 PDF files/i, "PDF tool should enforce the file-count limit");
    await page.locator("#pdf-files").setInputFiles([
      { name: "sample-a.pdf", mimeType: "application/pdf", buffer: sampleBuffer },
      { name: "sample-b.pdf", mimeType: "application/pdf", buffer: sampleBuffer }
    ]);
    await page.locator("#pdf-action").selectOption("merge");
    const mergeDownloadPromise = page.waitForEvent("download");
    await page.locator("#process-pdf").click();
    const mergeDownload = await mergeDownloadPromise;
    assert.equal(mergeDownload.suggestedFilename(), "calcora-merged.pdf", "PDF merge should produce a download");
    await page.locator("#pdf-files").setInputFiles({ name: "sample.pdf", mimeType: "application/pdf", buffer: sampleBuffer });
    await page.locator("#pdf-action").selectOption("split");
    await page.locator("#pdf-range").fill("1-1");
    const splitDownloadPromise = page.waitForEvent("download");
    await page.locator("#process-pdf").click();
    const splitDownload = await splitDownloadPromise;
    assert.equal(splitDownload.suggestedFilename(), "calcora-pages-1-1.pdf", "PDF page extraction should produce a download");
    await page.locator("#pdf-action").selectOption("rotate");
    await page.locator("#pdf-rotation").selectOption("90");
    const rotateDownloadPromise = page.waitForEvent("download");
    await page.locator("#process-pdf").click();
    const rotateDownload = await rotateDownloadPromise;
    assert.equal(rotateDownload.suggestedFilename(), "calcora-rotated.pdf", "PDF rotation should produce a download");
    await page.locator("#language-select").selectOption("fr");
    assert.equal(await page.locator("html").getAttribute("lang"), "fr", "Learning Lab language selector should switch to French");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(new URL("learning-lab.html", base).href, { waitUntil: "domcontentloaded" });
    const labMobile = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
    if (labMobile.content > labMobile.viewport + 2) failures.push("learning-lab.html overflows horizontally on mobile (" + labMobile.content + "px content vs " + labMobile.viewport + "px viewport)");
    await page.screenshot({ path: "artifacts/learning-lab-mobile.png", fullPage: true });

    // Check core student pages at a narrow mobile viewport for horizontal overflow.
    await page.setViewportSize({ width: 390, height: 844 });
    for (const path of ["index.html", "study-planner.html", "exam-planner.html", "student-workspace.html"]) {
      await page.goto(new URL(path, base).href, { waitUntil: "domcontentloaded" });
      const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
      if (dimensions.content > dimensions.viewport + 2) failures.push(path + " overflows horizontally on mobile (" + dimensions.content + "px content vs " + dimensions.viewport + "px viewport)");
    }

    if (pageErrors.length) failures.push(...pageErrors.map(e => e.url + " raised JavaScript error: " + e.message));
    if (failures.length) {
      console.error("Browser smoke test failures:");
      failures.forEach(failure => console.error("- " + failure));
      process.exitCode = 1;
    } else {
      console.log("Browser smoke tests passed for " + urls.length + " sitemap URLs, " + internalLinks.size + " internal links, page descriptions and cards, plus language, theme, search, category filter and FAQ interactions.");
    }
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
