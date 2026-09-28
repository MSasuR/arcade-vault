const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('🔗 Testing navigation links...\n');
  
  // Test 1: Home -> Explore Games -> Home
  console.log('Test 1: Home → /games (Explore button)');
  await page.goto('http://localhost:3000');
  await page.locator('.home-ctas button:first-child').click();
  await page.waitForURL('/games');
  console.log('✓ Navigated to /games\n');
  
  // Test 2: Games -> Back to Home (Logo)
  console.log('Test 2: /games → Home (Logo click)');
  await page.locator('.logo').click();
  await page.waitForURL('/');
  console.log('✓ Navigated back to home\n');
  
  // Test 3: Home -> Create Account
  console.log('Test 3: Home → /auth (Create Account)');
  await page.locator('.home-ctas button:nth-child(2)').click();
  await page.waitForURL('/auth');
  console.log('✓ Navigated to /auth\n');
  
  // Test 4: Auth -> Back to Home (Logo)
  console.log('Test 4: /auth → Home (Logo click)');
  await page.locator('.logo').click();
  await page.waitForURL('/');
  console.log('✓ Navigated back to home\n');
  
  // Test 5: Home -> Hall of Fame
  console.log('Test 5: Home → /salon (Activity section link)');
  await page.goto('http://localhost:3000');
  await page.locator('.lb-link').click();
  await page.waitForURL('/salon');
  console.log('✓ Navigated to /salon\n');
  
  // Test 6: Hall of Fame -> Back to Library
  console.log('Test 6: /salon → /games (Back to Library button)');
  await page.locator('button:has-text("VOLVER A LA BIBLIOTECA")').click();
  await page.waitForURL('/games');
  console.log('✓ Navigated to /games\n');
  
  console.log('✅ All navigation tests passed!');
  await browser.close();
  process.exit(0);
})().catch(error => {
  console.error('❌ Navigation test failed:', error.message);
  process.exit(1);
});
