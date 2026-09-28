const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(`  [Browser] ${msg.text()}`));
  page.on('pageerror', err => console.log(`  [Error] ${err.message}`));
  
  console.log('🔍 Testing /games page...\n');
  await page.goto('http://localhost:3000/games', { waitUntil: 'domcontentloaded' });
  
  const gamesTitle = await page.locator('h1, h2').first().textContent();
  console.log(`  Title found: ${gamesTitle}`);
  
  const cards = await page.locator('.card, .av-grid > div').count();
  console.log(`  Cards found: ${cards}`);
  
  if (cards === 0) {
    console.log('  ❌ No cards found - checking for errors\n');
    const html = await page.locator('body').innerHTML();
    console.log('  Page HTML snippet:', html.substring(0, 200));
  } else {
    console.log('  ✓ /games page working\n');
  }
  
  console.log('🔍 Testing /salon page...\n');
  await page.goto('http://localhost:3000/salon', { waitUntil: 'domcontentloaded' });
  
  const salonTitle = await page.locator('h1, h2').first().textContent();
  console.log(`  Title found: ${salonTitle}`);
  
  const podium = await page.locator('.podium').count();
  const table = await page.locator('.hall-table').count();
  console.log(`  Podium found: ${podium}`);
  console.log(`  Table found: ${table}`);
  
  if (podium === 0 && table === 0) {
    console.log('  ❌ No podium/table found - checking for errors\n');
  } else {
    console.log('  ✓ /salon page working\n');
  }
  
  await browser.close();
})().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});
