const { chromium } = require('playwright');

async function inspectPage() {
  console.log('🔍 Inspecting page content...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    await page.goto('https://app.kasama.ai', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000); // Wait longer for React to fully load
    
    // Get page title and basic info
    const title = await page.title();
    const url = page.url();
    console.log(`📄 Title: ${title}`);
    console.log(`🔗 URL: ${url}`);
    
    // Check for errors in console
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`🚨 Console Error: ${msg.text()}`);
      }
    });
    
    // Get the body content
    const bodyContent = await page.locator('body').innerHTML();
    console.log(`📝 Body content length: ${bodyContent.length} characters`);
    
    // Check for specific React/JS framework indicators
    const hasReactRoot = await page.locator('#root, #app, [data-reactroot]').count();
    console.log(`⚛️  React root elements found: ${hasReactRoot}`);
    
    // Look for loading indicators or error messages
    const loadingElements = await page.locator('[data-testid*="loading"], .loading, .spinner').count();
    const errorElements = await page.locator('[data-testid*="error"], .error, .alert-error').count();
    console.log(`⏳ Loading elements: ${loadingElements}`);
    console.log(`❌ Error elements: ${errorElements}`);
    
    // Check for main content areas
    const mainContent = await page.locator('main, #main, .main, [role="main"]').count();
    const navigation = await page.locator('nav, .nav, .navbar, [role="navigation"]').count();
    console.log(`📋 Main content areas: ${mainContent}`);
    console.log(`🧭 Navigation elements: ${navigation}`);
    
    // Get visible text content
    const visibleText = await page.locator('body').textContent();
    console.log(`📖 Visible text preview: "${visibleText?.substring(0, 200)}..."`);
    
    // Check if JavaScript executed successfully
    const scriptTags = await page.locator('script').count();
    console.log(`📜 Script tags found: ${scriptTags}`);
    
    // Take a final screenshot with more detailed view
    await page.screenshot({ 
      path: 'screenshots/detailed_inspection.png',
      fullPage: true 
    });
    console.log('📸 Detailed inspection screenshot saved');
    
  } catch (error) {
    console.error('❌ Error inspecting page:', error);
  } finally {
    await browser.close();
  }
}

inspectPage().catch(console.error);
