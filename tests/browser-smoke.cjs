const assert = require("node:assert/strict");
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
    assert.match(await page.locator("#units-result").innerText(), /1000/, "one kilometre should convert to 1000 metres");

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
