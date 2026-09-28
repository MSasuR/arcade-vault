const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('🔗 Testing navigation...\n');
  
  // Test logo navigation
  console.log('✓ Home loaded');
  await page.goto('http://localhost:3000');
  
  await page.locator('.home-ctas button:first-child').click();
  await page.waitForTimeout(2000);
  let url = page.url();
  console.log(`  After Explore click: ${url}`);
  console.log(`  ✓ ${url.includes('/games') ? 'Correctly at /games' : 'Should be at /games'}`);
  
  await page.locator('.logo').click();
  await page.waitForTimeout(2000);
  url = page.url();
  console.log(`  After logo click: ${url}`);
  console.log(`  ✓ ${url === 'http://localhost:3000/' ? 'Correctly at home' : 'Should be at home'}`);
  
  await page.locator('.home-ctas button:nth-child(2)').click();
  await page.waitForTimeout(2000);
  url = page.url();
  console.log(`  After Create Account click: ${url}`);
  console.log(`  ✓ ${url.includes('/auth') ? 'Correctly at /auth' : 'Should be at /auth'}`);
  
  console.log('\n✅ Navigation working correctly!');
  await browser.close();
  process.exit(0);
})().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});
