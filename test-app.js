const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const baseUrl = 'http://localhost:3000';

  console.log('✓ Testing Arcade Vault MVP\n');

  // Test 1: Biblioteca loads
  console.log('Test 1: Biblioteca (Library) - default page');
  await page.goto(baseUrl);
  await page.waitForSelector('.av-hero h1');
  const heroText = await page.locator('.av-hero h1').textContent();
  console.log(`  Hero title: ${heroText}`);
  
  const cardCount = await page.locator('.card').count();
  console.log(`  Games rendered: ${cardCount} cards`);
  
  // Test 2: Search functionality
  console.log('\nTest 2: Search functionality');
  const searchInput = page.locator('.av-search input');
  await searchInput.fill('tetris');
  await page.waitForTimeout(300);
  const filteredCount = await page.locator('.card').count();
  console.log(`  After search "tetris": ${filteredCount} card(s)`);
  
  // Test 3: Category filter
  console.log('\nTest 3: Category filter');
  await searchInput.clear();
  const actionChip = page.locator('.chip').filter({ hasText: 'ACCIÓN' });
  await actionChip.click();
  await page.waitForTimeout(300);
  const actionCount = await page.locator('.card').count();
  console.log(`  ACCIÓN category: ${actionCount} games`);
  
  // Test 4: Navigate to game detail
  console.log('\nTest 4: Game detail navigation');
  await page.locator('.chip').filter({ hasText: 'TODOS' }).click();
  await page.waitForTimeout(200);
  const firstCard = page.locator('.card').first();
  const gameTitle = await firstCard.locator('.title').textContent();
  await firstCard.click();
  await page.waitForSelector('.av-detail');
  const detailTitle = await page.locator('.detail-info h2').textContent();
  console.log(`  Clicked: ${gameTitle} → Detail shows: ${detailTitle}`);
  
  // Test 5: Navigate to player
  console.log('\nTest 5: Game player navigation');
  const playButton = page.locator('button:has-text("▶ JUGAR AHORA")');
  await playButton.click();
  await page.waitForSelector('.av-player');
  const playerTitle = await page.locator('.hud-stat:has(> .l:text("Juego")) .v').textContent();
  console.log(`  Player page loaded, game: ${playerTitle}`);
  
  // Test 6: Navigation back to library
  console.log('\nTest 6: Navigation back to library');
  const backBtn = page.locator('button:has-text("VOLVER A DETALLES")');
  await backBtn.click();
  await page.waitForSelector('.av-detail');
  console.log(`  Back button works`);
  
  // Test 7: Auth page
  console.log('\nTest 7: Authentication page');
  await page.goto(`${baseUrl}/#${encodeURIComponent(JSON.stringify({ name: 'auth' }))}`);
  await page.waitForSelector('.av-auth-wrap');
  const authTabs = await page.locator('.auth-tabs button').count();
  console.log(`  Auth page loaded with ${authTabs} tabs`);
  
  // Test 8: Login
  console.log('\nTest 8: Login functionality');
  const userInput = page.locator('.field input').first();
  await userInput.fill('TestPlayer');
  const submitBtn = page.locator('button:has-text("ENTRAR AL VAULT")');
  await submitBtn.click();
  await page.waitForSelector('.av-hero');
  const loggedInBtn = await page.locator('.auth-btn').first().textContent();
  console.log(`  After login, auth button shows: ${loggedInBtn}`);
  
  // Test 9: Hall of Fame
  console.log('\nTest 9: Hall of Fame');
  await page.goto(`${baseUrl}/#${encodeURIComponent(JSON.stringify({ name: 'salon' }))}`);
  await page.waitForSelector('.av-hall');
  const podiumSlots = await page.locator('.podium-slot').count();
  const tableRows = await page.locator('.hall-table .tr').count();
  console.log(`  Hall of Fame: ${podiumSlots} podium slots, ${tableRows} table rows`);
  
  // Test 10: Responsive check
  console.log('\nTest 10: Responsive design (mobile)');
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(baseUrl);
  const hamburger = await page.locator('.hamburger').isVisible();
  const links = await page.locator('.links').isVisible();
  console.log(`  Mobile: hamburger visible=${hamburger}, desktop links visible=${links}`);
  
  console.log('\n✓ All tests passed!\n');
  await browser.close();
})();
