const { chromium } = require('playwright');
const path = require('path');

async function takeScreenshots() {
  console.log('🚀 Starting Playwright screenshot session...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  });
  
  const page = await context.newPage();
  
  const baseUrl = 'https://app.kasama.ai';
  const screenshots = [];
  
  try {
    // Homepage
    console.log('📸 Taking screenshot of homepage...');
    await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000); // Wait for React to load
    await page.screenshot({ 
      path: path.join(__dirname, 'screenshots', 'homepage.png'),
      fullPage: true 
    });
    screenshots.push('homepage.png');
    console.log('✅ Homepage screenshot saved');

    // Try to navigate to different routes that might exist
    const routes = ['/login', '/signup', '/dashboard', '/assessment', '/practices'];
    
    for (const route of routes) {
      try {
        console.log(`📸 Attempting screenshot of ${route}...`);
        await page.goto(`${baseUrl}${route}`, { 
          waitUntil: 'networkidle', 
          timeout: 10000 
        });
        await page.waitForTimeout(2000);
        
        // Check if we got a 404 or if the route loaded successfully
        const title = await page.title();
        const url = page.url();
        
        if (!title.toLowerCase().includes('not found') && !title.toLowerCase().includes('404')) {
          const filename = `${route.substring(1) || 'root'}.png`;
          await page.screenshot({ 
            path: path.join(__dirname, 'screenshots', filename),
            fullPage: true 
          });
          screenshots.push(filename);
          console.log(`✅ ${route} screenshot saved as ${filename}`);
        } else {
          console.log(`⚠️  ${route} appears to be 404 or not found, skipping`);
        }
      } catch (error) {
        console.log(`⚠️  Could not access ${route}: ${error.message}`);
      }
    }

    // Test some interactions on the homepage
    console.log('🔍 Testing interactive elements...');
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Look for buttons, forms, or interactive elements
    const buttons = await page.locator('button, [role="button"], .btn').count();
    const links = await page.locator('a[href]').count();
    const forms = await page.locator('form').count();
    
    console.log(`📊 Found ${buttons} buttons, ${links} links, ${forms} forms`);
    
    // Take a screenshot after interaction
    await page.screenshot({ 
      path: path.join(__dirname, 'screenshots', 'homepage_detailed.png'),
      fullPage: true 
    });
    screenshots.push('homepage_detailed.png');

  } catch (error) {
    console.error('❌ Error during screenshot process:', error);
  } finally {
    await browser.close();
    console.log(`🏁 Screenshot session complete. Saved ${screenshots.length} screenshots:`);
    screenshots.forEach(file => console.log(`   - screenshots/${file}`));
  }
}

// Create screenshots directory
const fs = require('fs');
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

takeScreenshots().catch(console.error);
