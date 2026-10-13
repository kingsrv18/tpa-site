import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.TPA_PLAYWRIGHT_PATH || 'playwright');
const url = process.env.TPA_PREVIEW_URL || 'http://localhost:5174';
const screenshotDir = new URL('../review/', import.meta.url);
await fs.mkdir(screenshotDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const failures = [];
const heroOnly = process.argv.includes('--hero-only');
const atlasOnly = process.argv.includes('--atlas-only');
try {
  for (const width of [1440, 1024, 768, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.url().startsWith(url) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
    });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('#atlas-book').getAttribute('data-open'), 'false');
    assert.equal(await page.locator('#atlas-spread').isVisible(), false);
    assert.equal(await page.locator('#book-navigation').isVisible(), false);
    const layout = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, imageLoaded: document.querySelector('.hero-illustration img').naturalWidth > 0, fonts: document.fonts.check('400 77px "Cormorant Garamond"') && document.fonts.check('400 16px "Plus Jakarta Sans"') }));
    assert.ok(layout.scrollWidth <= width, `Horizontal overflow at ${width}: ${layout.scrollWidth}`);
    assert.ok(layout.imageLoaded && layout.fonts, `Assets not loaded at ${width}`);
    assert.deepEqual(errors, [], `Browser errors at ${width}`);
    if (heroOnly) {
      if (width === 1440 || width === 390) await page.locator('.hero').screenshot({ path: new URL(`hero-${width}.png`, screenshotDir).pathname.replace(/^\/([A-Z]:)/, '$1') });
      console.log(`PASS ${width}px: watercolor asset, fonts, hero layout and no browser errors`);
      await page.close();
      continue;
    }
    // Visit each reveal once so full-page evidence shows settled, visible content.
    for (const block of await page.locator('.reveal-ready').all()) await block.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => !document.querySelector('.reveal-pending'));
    await page.waitForTimeout(700);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    if (width === 1440 || width === 390) {
      await page.screenshot({ path: new URL(`${width === 1440 ? 'desktop' : 'mobile'}.png`, screenshotDir).pathname.replace(/^\/([A-Z]:)/, '$1'), fullPage: true });
      await page.locator('.city-atlas').screenshot({ path: new URL(`atlas-${width}.png`, screenshotDir).pathname.replace(/^\/([A-Z]:)/, '$1') });
    }
    const cover = page.getByRole('button', { name: 'Open the TPA Kolkata atlas' });
    assert.equal(await cover.locator('.cover-title').innerText(), 'Welcome\nto TPA');
    assert.equal(await cover.getByRole('img', { name: 'TPA monogram' }).isVisible(), true);
    await cover.focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#atlas-book').getAttribute('data-open'), 'true');
    assert.equal(await page.locator('#book-page-number').textContent(), 'Chapter 1 of 3');
    await page.waitForFunction(() => document.querySelector('#open-book').hidden);
    await page.waitForFunction(() => [...document.querySelectorAll('[data-book-image] img')].every(img => img.complete && img.naturalWidth > 0));
    assert.equal(await page.locator('.book-image-panel:not([hidden])').getAttribute('data-book-image'), 'map');
    assert.equal(await page.locator('#atlas-credit').isVisible(), true);
    const imageSources = await page.locator('[data-book-image] img').evaluateAll(images => images.map(img => img.getAttribute('src')));
    assert.equal(new Set(imageSources).size, 3, 'Three pages must use three different image files');
    if (width === 1440 || width === 390) await page.locator('.city-atlas').screenshot({ path: new URL(`book-map-first-${width}.png`, screenshotDir).pathname.replace(/^\/([A-Z]:)/, '$1') });
    await page.locator('.map-page-heading').click();
    assert.equal(await page.locator('#book-page-number').textContent(), 'Chapter 2 of 3');
    assert.equal(await page.locator('.book-image-panel:not([hidden])').getAttribute('data-book-image'), 'community');
    assert.equal(await page.locator('#atlas-credit').isVisible(), false);
    assert.equal(await page.locator('[data-book-image="community"] img').evaluate(img => getComputedStyle(img).opacity), '0.45');
    if (width === 1440 || width === 390) {
      await page.waitForFunction(() => !document.querySelector('#atlas-book').classList.contains('is-turning'));
      await page.locator('.city-atlas').screenshot({ path: new URL(`book-community-${width}.png`, screenshotDir).pathname.replace(/^\/([A-Z]:)/, '$1') });
    }
    await page.getByRole('button', { name: 'Close book', exact: true }).click();
    assert.equal(await page.locator('#atlas-book').getAttribute('data-open'), 'false');
    assert.equal(await cover.evaluate(el => document.activeElement === el), true);
    await page.getByRole('button', { name: 'Find Tollygunge on the map' }).click();
    assert.equal(await page.locator('#tollygunge-marker').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('#book-chapter-title').textContent(), 'A City Of Ideas.');
    await page.getByRole('button', { name: 'Next book chapter' }).click();
    assert.equal(await page.locator('#book-page-number').textContent(), 'Chapter 2 of 3');
    await page.getByRole('button', { name: 'Next book chapter' }).click();
    assert.equal(await page.locator('#book-page-number').textContent(), 'Chapter 3 of 3');
    assert.equal(await page.locator('#next-chapter').isDisabled(), true);
    assert.equal(await page.locator('.book-image-panel:not([hidden])').getAttribute('data-book-image'), 'knowledge');
    assert.equal(await page.locator('#atlas-credit').isVisible(), false);
    if (width === 1440 || width === 390) {
      await page.waitForFunction(() => !document.querySelector('#atlas-book').classList.contains('is-turning'));
      await page.locator('.city-atlas').screenshot({ path: new URL(`book-knowledge-${width}.png`, screenshotDir).pathname.replace(/^\/([A-Z]:)/, '$1') });
    }
    await page.getByRole('button', { name: 'Previous book chapter' }).click();
    await page.getByRole('button', { name: 'Previous book chapter' }).click();
    assert.equal(await page.locator('#book-page-number').textContent(), 'Chapter 1 of 3');
    assert.equal(await page.locator('#previous-chapter').isDisabled(), true);
    assert.equal(await page.locator('.book-image-panel:not([hidden])').getAttribute('data-book-image'), 'map');
    const marker = page.getByRole('button', { name: 'Highlight Tollygunge, South Kolkata' });
    await marker.focus();
    await page.keyboard.press('Enter');
    assert.equal(await marker.getAttribute('aria-pressed'), 'false');
    await page.keyboard.press('Enter');
    assert.equal(await marker.getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('#book-page-number').textContent(), 'Chapter 1 of 3');
    assert.equal(await page.locator('.map-layer img').evaluate(img => img.complete && img.naturalWidth > 0), true);
    if (width === 1440 || width === 390) {
      await page.waitForFunction(() => document.querySelector('#open-book').hidden);
      await page.waitForTimeout(600);
      await page.locator('.city-atlas').screenshot({ path: new URL(`atlas-open-${width}.png`, screenshotDir).pathname.replace(/^\/([A-Z]:)/, '$1') });
    }
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#atlas-book').getAttribute('data-open'), 'false');
    if (atlasOnly) {
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      console.log(`PASS ${width}px: 3 distinct loaded images, forward/back page turns, map interaction, close and no overflow`);
      await page.close();
      continue;
    }
    if (width < 1001) {
      const toggle = page.getByRole('button', { name: 'Menu', exact: true });
      await toggle.click();
      assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
      await page.locator('#mobile-navigation').getByRole('link', { name: 'Membership', exact: true }).click();
      assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
      await toggle.click();
      await page.keyboard.press('Escape');
      assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    }
    for (const key of ['gst', 'audit', 'fellowship']) {
      const trigger = page.locator(`[data-event="${key}"]`);
      await trigger.click();
      await page.locator('#event-dialog').waitFor({ state: 'visible' });
      assert.ok(await page.locator('#event-dialog-title').textContent());
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#event-dialog').isVisible(), false);
      assert.equal(await trigger.evaluate(element => document.activeElement === element), true);
    }
    await page.locator('#membership-form').getByRole('button', { name: 'Continue registration' }).click();
    assert.equal(await page.locator('#name-error').isVisible(), true);
    assert.equal(await page.locator('#email-error').isVisible(), true);
    await page.locator('#member-name').fill('Ananya Sen');
    await page.locator('#member-email').fill('not-an-email');
    await page.locator('#membership-form').getByRole('button', { name: 'Continue registration' }).click();
    assert.equal(await page.locator('#email-error').isVisible(), true);
    await page.locator('#member-email').fill('ananya@example.com');
    await page.locator('#membership-form').getByRole('button', { name: 'Continue registration' }).click();
    assert.equal(await page.locator('#registration-handoff').isVisible(), true);
    assert.equal(await page.locator('#review-name').textContent(), 'Ananya Sen');
    await page.getByRole('button', { name: 'Edit details', exact: true }).click();
    assert.equal(await page.locator('#member-name').inputValue(), 'Ananya Sen');
    assert.equal(await page.locator('#membership-form').isVisible(), true);
    const overflowAfterInteraction = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    assert.equal(overflowAfterInteraction, false, `Interaction overflow at ${width}`);
    console.log(`PASS ${width}px: atlas chapters/marker, reveals, assets, layout, navigation, dialogs and form`);
    await page.close();
  }
  if (!heroOnly) {
  const reduced = await browser.newPage({ viewport: { width: 390, height: 900 }, reducedMotion: 'reduce' });
  await reduced.goto(url, { waitUntil: 'networkidle' });
  assert.equal(await reduced.locator('.reveal-pending').count(), 0);
  await reduced.getByRole('button', { name: 'Open the TPA Kolkata atlas' }).click();
  assert.equal(await reduced.locator('#atlas-book').evaluate(el => el.classList.contains('is-opening')), false);
  assert.equal(await reduced.locator('#open-book').isVisible(), false);
  await reduced.getByRole('button', { name: 'Next book chapter' }).click();
  assert.equal(await reduced.locator('#atlas-book').evaluate(el => el.classList.contains('is-turning')), false);
  const motion = await reduced.locator('.map-layer').evaluate(el => getComputedStyle(el).transitionDuration);
  assert.equal(motion, '0s');
  console.log('PASS reduced motion: visible content, functional chapters, no page-turn or map transition');
  await reduced.close();
  }
} catch (error) { failures.push(error); }
finally { await browser.close(); }
if (failures.length) throw failures[0];
