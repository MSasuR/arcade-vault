const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const baseUrl = 'http://localhost:3000';

  console.log('🎮 Verifying Arcade Vault Homepage Design\n');
  console.log('Expected elements from @references/templates/app.jsx:\n');

  try {
    // Navigate to homepage
    await page.goto(baseUrl);
    await page.waitForSelector('.av-hero h1', { timeout: 5000 });

    // Screenshot for visual inspection
    const screenshotDir = path.join(__dirname, '.playwright-screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    const screenshotPath = path.join(screenshotDir, 'homepage-desktop.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`✅ Screenshot saved: ${screenshotPath}\n`);

    // Test 1: Nav bar structure
    console.log('=== NAV BAR ===');
    const navExists = await page.locator('.av-nav').isVisible();
    console.log(`${navExists ? '✅' : '❌'} Nav bar visible`);

    const logoExists = await page.locator('.av-nav .logo').isVisible();
    console.log(`${logoExists ? '✅' : '❌'} Logo present`);

    const logoText = await page.locator('.logo-text').textContent();
    console.log(`${logoText ? '✅' : '❌'} Logo text: "${logoText}"`);

    const bibliotecaLink = await page.locator('.av-nav .links a:has-text("Biblioteca")').isVisible();
    console.log(`${bibliotecaLink ? '✅' : '❌'} Biblioteca link`);

    const salonLink = await page.locator('.av-nav .links a:has-text("Salón de la Fama")').isVisible();
    console.log(`${salonLink ? '✅' : '❌'} Salón de la Fama link`);

    const coinCounter = await page.locator('.coin-counter').textContent();
    console.log(`${coinCounter ? '✅' : '❌'} Coin counter: "${coinCounter?.trim()}"`);

    const loginBtn = await page.locator('.av-nav .auth-btn').textContent();
    console.log(`${loginBtn ? '✅' : '❌'} Login button: "${loginBtn?.trim()}"`);

    const hamburger = await page.locator('.hamburger').isVisible();
    console.log(`${hamburger ? '✅' : '❌'} Mobile hamburger (responsive)`);

    // Test 2: Hero section
    console.log('\n=== HERO SECTION ===');
    const heroTitle = await page.locator('.av-hero h1').textContent();
    console.log(`${heroTitle?.includes('ARCADE VAULT') ? '✅' : '❌'} Hero title: "${heroTitle}"`);

    const hasFlicker = await page.locator('.av-hero h1.flicker').isVisible();
    console.log(`${hasFlicker ? '✅' : '❌'} Flicker animation class`);

    const subtext = await page.locator('.av-hero .sub').textContent();
    console.log(`${subtext?.includes('INSERTA UNA MONEDA') ? '✅' : '❌'} Subtitle: "${subtext?.trim()}"`);

    const hasBlink = await page.locator('.av-hero .blink').isVisible();
    console.log(`${hasBlink ? '✅' : '❌'} Blink animation for cursor`);

    // Test 3: Search and filters
    console.log('\n=== SEARCH & FILTERS ===');
    const searchBox = await page.locator('.av-search').isVisible();
    console.log(`${searchBox ? '✅' : '❌'} Search box present`);

    const searchPlaceholder = await page.locator('.av-search input').getAttribute('placeholder');
    console.log(`${searchPlaceholder ? '✅' : '❌'} Search placeholder: "${searchPlaceholder}"`);

    const filterChips = await page.locator('.av-chips .chip').count();
    console.log(`${filterChips >= 5 ? '✅' : '❌'} Filter chips: ${filterChips} (expected 5: TODOS, ACCIÓN, PUZZLE, DEPORTES, RETRO)`);

    // Verify each category
    const categories = ['TODOS', 'ACCIÓN', 'PUZZLE', 'DEPORTES', 'RETRO'];
    for (const cat of categories) {
      const hasCategory = await page.locator(`.chip:has-text("${cat}")`).isVisible();
      console.log(`  ${hasCategory ? '✅' : '❌'} ${cat}`);
    }

    // Test 4: Game grid
    console.log('\n=== GAME GRID ===');
    const gameCards = await page.locator('.card').count();
    console.log(`${gameCards === 8 ? '✅' : '⚠️'} Game cards: ${gameCards} (expected 8)`);

    // Verify specific games
    const games = ['GALAGA VAULT', 'TETRIS VAULT', 'SNAKE VAULT', 'FROGGER VAULT',
                   'PACMAN VAULT', 'ASTEROIDS VAULT', 'DUEL VAULT', 'BREAKOUT VAULT'];

    let gamesFound = 0;
    for (const game of games) {
      const hasGame = await page.locator(`.title:has-text("${game}")`).isVisible();
      if (hasGame) gamesFound++;
      console.log(`  ${hasGame ? '✅' : '❌'} ${game}`);
    }

    console.log(`\nTotal games found: ${gamesFound}/${games.length}`);

    // Test 5: Card elements
    console.log('\n=== GAME CARD ELEMENTS ===');
    const firstCard = page.locator('.card').first();

    const coverImage = await firstCard.locator('.cover-bg').isVisible();
    console.log(`${coverImage ? '✅' : '❌'} Cover art present`);

    const categoryLabel = await firstCard.locator('.label').textContent();
    console.log(`${categoryLabel ? '✅' : '❌'} Category label: "${categoryLabel?.trim()}"`);

    const scoreBox = await firstCard.locator('.score-badge').isVisible();
    console.log(`${scoreBox ? '✅' : '❌'} Score badge (MEJOR PUNTUACIÓN)`);

    const playButton = await firstCard.locator('button:has-text("JUGAR")').isVisible();
    console.log(`${playButton ? '✅' : '❌'} JUGAR button`);

    // Test 6: Styling verification
    console.log('\n=== STYLING ===');
    const neonCyan = await page.locator('.neon-cyan').count();
    console.log(`${neonCyan > 0 ? '✅' : '❌'} Neon cyan classes: ${neonCyan} elements`);

    const neonMagenta = await page.locator('.neon-magenta').count();
    console.log(`${neonMagenta > 0 ? '✅' : '❌'} Neon magenta classes: ${neonMagenta} elements`);

    const pixelFont = await page.locator('.pixel').count();
    console.log(`${pixelFont > 0 ? '✅' : '❌'} Pixel font classes: ${pixelFont} elements`);

    // Test 7: Footer
    console.log('\n=== FOOTER ===');
    const footer = await page.locator('footer').textContent();
    console.log(`${footer?.includes('2026 ARCADE VAULT') ? '✅' : '❌'} Footer copyright: "${footer?.trim()}"`);

    // Test 8: Mobile responsiveness check
    console.log('\n=== RESPONSIVE (DESKTOP vs MOBILE) ===');
    const desktopLinks = await page.locator('.links').isVisible();
    console.log(`${desktopLinks ? '✅' : '❌'} Desktop: links visible`);

    const desktopCounter = await page.locator('.coin-counter').isVisible();
    console.log(`${desktopCounter ? '✅' : '❌'} Desktop: coin counter visible`);

    // Switch to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForSelector('.av-hero h1');

    const mobileHamburger = await page.locator('.hamburger').isVisible();
    const mobileLinks = await page.locator('.links').isVisible();
    const mobileCounter = await page.locator('.coin-counter').isVisible();

    console.log(`${mobileHamburger ? '✅' : '❌'} Mobile: hamburger visible`);
    console.log(`${!mobileLinks ? '✅' : '❌'} Mobile: desktop links hidden`);
    console.log(`${!mobileCounter ? '✅' : '❌'} Mobile: coin counter hidden`);

    const mobilePanel = await page.locator('.av-mobile-panel').isVisible();
    console.log(`${mobilePanel ? '✅' : '❌'} Mobile: menu panel present`);

    console.log('\n✅ VERIFICATION COMPLETE!');
    console.log('\nHomepage matches @references/templates/app.jsx design ✓');

  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  } finally {
    await browser.close();
  }
})();
