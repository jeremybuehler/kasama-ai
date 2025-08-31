const { chromium } = require('playwright');

async function debugApplication() {
  console.log('🐛 Debugging application deployment...');
  
  const browser = await chromium.launch({ headless: false, devtools: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Capture all console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    consoleMessages.push({ type, text });
    
    if (type === 'error') {
      console.log(`🚨 Console Error: ${text}`);
    } else if (type === 'warn') {
      console.log(`⚠️  Console Warning: ${text}`);
    } else if (type === 'log') {
      console.log(`📝 Console Log: ${text}`);
    }
  });
  
  // Capture network failures
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`🌐 Network Error: ${response.status()} ${response.url()}`);
    }
  });
  
  try {
    console.log('🌐 Navigating to https://app.kasama.ai...');
    await page.goto('https://app.kasama.ai', { 
      waitUntil: 'networkidle', 
      timeout: 30000 
    });
    
    // Wait for React to potentially load
    await page.waitForTimeout(10000);
    
    // Check current URL
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    // Check if any React components loaded
    const reactElements = await page.locator('[data-reactroot], #root div, .react-component').count();
    console.log(`⚛️  React elements found: ${reactElements}`);
    
    // Check for specific error messages
    const errorMessages = await page.locator('.error, [class*="error"], [data-testid*="error"]').count();
    console.log(`❌ Error elements: ${errorMessages}`);
    
    // Try to find any visible content
    const bodyText = await page.locator('body').textContent();
    console.log(`📖 Body text (first 500 chars): "${bodyText?.substring(0, 500)}..."`);
    
    // Check if JavaScript is working by testing window object
    const jsWorking = await page.evaluate(() => {
      return typeof window !== 'undefined' && typeof document !== 'undefined';
    });
    console.log(`🔧 JavaScript working: ${jsWorking}`);
    
    // Try to access React
    const reactWorking = await page.evaluate(() => {
      return typeof React !== 'undefined' || window.React !== undefined;
    });
    console.log(`⚛️  React available: ${reactWorking}`);
    
    // Take a screenshot for analysis
    await page.screenshot({ 
      path: 'screenshots/debug_application.png',
      fullPage: true 
    });
    console.log('📸 Debug screenshot saved');
    
    // Summary of console messages
    console.log('\n📋 Console Summary:');
    const errorCount = consoleMessages.filter(m => m.type === 'error').length;
    const warnCount = consoleMessages.filter(m => m.type === 'warn').length;
    const logCount = consoleMessages.filter(m => m.type === 'log').length;
    
    console.log(`   - Errors: ${errorCount}`);
    console.log(`   - Warnings: ${warnCount}`);
    console.log(`   - Logs: ${logCount}`);
    
    if (errorCount > 0) {
      console.log('\n🚨 Critical Errors Found:');
      consoleMessages
        .filter(m => m.type === 'error')
        .forEach((msg, i) => console.log(`   ${i + 1}. ${msg.text}`));
    }
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    // Keep browser open for 30 seconds to allow manual inspection
    console.log('\n👀 Browser will stay open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);
    await browser.close();
  }
}

debugApplication().catch(console.error);
