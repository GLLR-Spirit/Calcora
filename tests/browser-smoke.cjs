const assert = require("node:assert/strict");
const { chromium } = require("playwright");

const base = (process.env.SITE_URL || "https://gllr-spirit.github.io/Calcora/").replace(/\/$/, "") + "/";
const failures = [];
const pageErrors = [];

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
        if (!title.trim()) failures.push(url + " has an empty document title");
        if (bodyText.length < 15) failures.push(url + " has almost no visible page content");
      } catch (error) {
        failures.push(url + " navigation failed: " + error.message);
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

    if (pageErrors.length) failures.push(...pageErrors.map(e => e.url + " raised JavaScript error: " + e.message));
    if (failures.length) {
      console.error("Browser smoke test failures:");
      failures.forEach(failure => console.error("- " + failure));
      process.exitCode = 1;
    } else {
      console.log("Browser smoke tests passed for " + urls.length + " sitemap URLs, plus language, theme, search, category filter and FAQ interactions.");
    }
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
