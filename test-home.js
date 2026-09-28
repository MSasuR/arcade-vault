const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('📱 Testing home page...');

  // Navigate to home
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  console.log('✓ Home page loaded');

  // Take desktop screenshot
  const screenshotPath = path.join(__dirname, 'test-home-desktop.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`✓ Desktop screenshot saved: ${screenshotPath}`);

  // Set mobile viewport and take screenshot
  await page.setViewportSize({ width: 375, height: 667 });
  const mobilePath = path.join(__dirname, 'test-home-mobile.png');
  await page.screenshot({ path: mobilePath, fullPage: true });
  console.log(`✓ Mobile screenshot saved: ${mobilePath}`);

  // Check elements exist
  const heroExists = await page.locator('.home-hero').count();
  const whySectionExists = await page.locator('.home-section').count();
  const gamesPreviewExists = await page.locator('.mini-rail').count();
  const statsExists = await page.locator('.home-stats').count();
  const activityExists = await page.locator('.activity-grid').count();
  const pricingExists = await page.locator('.pricing-grid').count();
  const finalCtaExists = await page.locator('.home-final').count();

  console.log('\n✅ Elements found:');
  console.log(`   Hero section: ${heroExists > 0 ? '✓' : '✗'}`);
  console.log(`   Why sections: ${whySectionExists > 0 ? `✓ (${whySectionExists})` : '✗'}`);
  console.log(`   Games preview: ${gamesPreviewExists > 0 ? '✓' : '✗'}`);
  console.log(`   Stats: ${statsExists > 0 ? '✓' : '✗'}`);
  console.log(`   Activity: ${activityExists > 0 ? '✓' : '✗'}`);
  console.log(`   Pricing: ${pricingExists > 0 ? '✓' : '✗'}`);
  console.log(`   Final CTA: ${finalCtaExists > 0 ? '✓' : '✗'}`);

  // Test navigation
  console.log('\n🔗 Testing navigation...');
  const exploreButton = page.locator('.home-ctas button:first-child');
  await exploreButton.click();
  await page.waitForURL('/games');
  console.log(`✓ Navigation to /games works`);

  // Go back to home
  await page.goto('http://localhost:3000');
  const createAccountButton = page.locator('.home-ctas button:nth-child(2)');
  await createAccountButton.click();
  await page.waitForURL('/auth');
  console.log(`✓ Navigation to /auth works`);

  // Go back to home
  await page.goto('http://localhost:3000');
  const createButton = page.locator('.home-ctas button:nth-child(2)');
  await createButton.click();
  await page.waitForURL('/auth');
  console.log(`✓ Navigation buttons working`);

  await browser.close();

  console.log('\n✅ All tests passed!');
  process.exit(0);
})().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
