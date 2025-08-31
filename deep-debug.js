const { chromium } = require('playwright');

async function deepDebugApplication() {
  console.log('🔬 Deep debugging application...');
  
  const browser = await chromium.launch({ 
    headless: true, // Run headless for cleaner output
    args: ['--disable-web-security'] // Allow cross-origin for debugging
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capture all console messages including uncaught exceptions
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log(`🎯 Console [${type.toUpperCase()}]: ${text}`);
  });
  
  // Capture JavaScript errors
  page.on('pageerror', error => {
    console.log(`💥 Page Error: ${error.message}`);
    console.log(`   Stack: ${error.stack}`);
  });
  
  // Capture network requests
  page.on('request', request => {
    console.log(`📡 Request: ${request.method()} ${request.url()}`);
  });
  
  // Capture network responses, especially errors
  page.on('response', response => {
    const status = response.status();
    const url = response.url();
    
    if (status >= 400) {
      console.log(`🚨 Failed Request: ${status} ${url}`);
    } else if (url.includes('.js') || url.includes('.css')) {
      console.log(`✅ Asset Loaded: ${status} ${url}`);
    }
  });
  
  // Capture console errors that might be thrown but not logged
  await page.addInitScript(() => {
    const originalError = console.error;
    console.error = (...args) => {
      window._consoleErrors = window._consoleErrors || [];
      window._consoleErrors.push(args.join(' '));
      originalError.apply(console, args);
    };
    
    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', event => {
      console.error('Unhandled Promise Rejection:', event.reason);
      window._unhandledRejections = window._unhandledRejections || [];
      window._unhandledRejections.push(event.reason);
    });
  });
  
  try {
    console.log('🌐 Navigating to https://app.kasama.ai...');
    await page.goto('https://app.kasama.ai', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for potential async errors
    await page.waitForTimeout(5000);
    
    console.log(`\n📍 Final URL: ${page.url()}`);
    
    // Check for runtime errors that might have been captured
    const consoleErrors = await page.evaluate(() => window._consoleErrors || []);
    const unhandledRejections = await page.evaluate(() => window._unhandledRejections || []);
    
    if (consoleErrors.length > 0) {
      console.log('\n🚨 Console Errors Found:');
      consoleErrors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
    }
    
    if (unhandledRejections.length > 0) {
      console.log('\n💥 Unhandled Promise Rejections:');
      unhandledRejections.forEach((rejection, i) => {
        console.log(`   ${i + 1}. ${JSON.stringify(rejection, null, 2)}`);
      });
    }
    
    // Check the actual DOM content
    const htmlContent = await page.content();
    console.log(`\n📄 HTML Content Length: ${htmlContent.length} characters`);
    
    // Look for specific error indicators in the DOM
    const hasErrorBoundary = await page.locator('[data-error-boundary], .error-boundary').count() > 0;
    const hasReactError = await page.evaluate(() => {
      const text = document.body.textContent || '';
      return text.includes('Error') || text.includes('failed') || text.includes('crashed');
    });
    
    console.log(`\n🔍 Error Analysis:`);
    console.log(`   - Error Boundary Present: ${hasErrorBoundary}`);
    console.log(`   - React Error in DOM: ${hasReactError}`);
    
    // Try to evaluate React state if possible
    try {
      const reactState = await page.evaluate(() => {
        const root = document.getElementById('root');
        return root ? {
          hasChildren: root.children.length > 0,
          innerHTML: root.innerHTML.substring(0, 200) + '...'
        } : null;
      });
      
      console.log(`\n⚛️  React Root Analysis:`);
      console.log(`   - Root Element Found: ${reactState ? 'Yes' : 'No'}`);
      if (reactState) {
        console.log(`   - Has Children: ${reactState.hasChildren}`);
        console.log(`   - Content Preview: ${reactState.innerHTML}`);
      }
    } catch (e) {
      console.log(`   - Could not analyze React root: ${e.message}`);
    }
    
    // Take a final screenshot
    await page.screenshot({ 
      path: 'screenshots/deep_debug.png',
      fullPage: true 
    });
    console.log('\n📸 Deep debug screenshot saved');
    
  } catch (error) {
    console.error('❌ Deep debug error:', error.message);
  } finally {
    await browser.close();
  }
}

deepDebugApplication().catch(console.error);
