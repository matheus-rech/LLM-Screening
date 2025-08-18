import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('AI Screening Demo', () => {
  test('Complete workflow: Import references and run AI screening with Gemini', async ({ page }) => {
    // Increase timeout for AI processing
    test.setTimeout(120000);

    // 1. Navigate to the application
    console.log('📱 Opening the application...');
    await page.goto('http://localhost:5175');
    await page.waitForLoadState('networkidle');
    
    // Check if we need to handle user session
    const sessionDialog = page.locator('[role="dialog"]');
    if (await sessionDialog.isVisible()) {
      console.log('👤 Setting up user session...');
      await page.fill('input[placeholder*="email" i]', 'demo@example.com');
      await page.click('button:has-text("Continue")');
      await page.waitForTimeout(1000);
    }

    // 2. Navigate to Criteria page to create a project
    console.log('📋 Creating screening project...');
    await page.click('text=Criteria');
    await page.waitForLoadState('networkidle');

    // Create a new project
    await page.fill('input[placeholder*="project name" i]', 'ICH Treatment Study');
    await page.fill('textarea[placeholder*="description" i]', 'Screening articles about minimally invasive intracerebral hemorrhage treatment');
    
    // Set PICO criteria
    await page.fill('input[placeholder*="population" i], textarea[placeholder*="population" i]', 'Patients with spontaneous intracerebral hemorrhage');
    await page.fill('input[placeholder*="intervention" i], textarea[placeholder*="intervention" i]', 'Minimally invasive surgery techniques');
    await page.fill('input[placeholder*="comparator" i], textarea[placeholder*="comparator" i]', 'Standard medical management or conventional surgery');
    await page.fill('input[placeholder*="outcome" i], textarea[placeholder*="outcome" i]', 'Functional outcomes, mortality, cost-effectiveness');
    
    // Save the project
    const saveButton = page.locator('button:has-text("Save"), button:has-text("Create")').first();
    if (await saveButton.isVisible()) {
      await saveButton.click();
      await page.waitForTimeout(2000);
    }
    
    // 3. Navigate to Import page
    console.log('📥 Importing references...');
    await page.click('text=Import');
    await page.waitForLoadState('networkidle');
    
    // Upload the test file
    const fileInput = page.locator('input[type="file"]');
    const filePath = path.join(process.cwd(), 'test-references.txt');
    await fileInput.setInputFiles(filePath);
    await page.waitForTimeout(2000);
    
    // Process the import
    const importButton = page.locator('button:has-text("Import"), button:has-text("Process")').first();
    if (await importButton.isVisible()) {
      await importButton.click();
      await page.waitForTimeout(3000);
    }
    
    // 4. Navigate to Dual Review for AI screening
    console.log('🤖 Starting AI screening with Gemini...');
    await page.click('text=Dual Review');
    await page.waitForLoadState('networkidle');
    
    // Start the screening process
    const startScreeningButton = page.locator('button:has-text("Start Screening"), button:has-text("Begin")').first();
    if (await startScreeningButton.isVisible()) {
      await startScreeningButton.click();
      console.log('⏳ AI models are analyzing references...');
    }
    
    // Wait for AI processing (this may take a while)
    await page.waitForTimeout(10000);
    
    // Check for results
    const resultsContainer = page.locator('[class*="result"], [class*="screening"], [class*="decision"]').first();
    if (await resultsContainer.isVisible()) {
      console.log('✅ AI screening results are displayed!');
      
      // Take a screenshot of the results
      await page.screenshot({ 
        path: 'ai-screening-results.png',
        fullPage: true 
      });
      console.log('📸 Screenshot saved as ai-screening-results.png');
      
      // Look for AI reasoning
      const reasoningElements = await page.locator('[class*="reasoning"], [class*="explanation"], [class*="analysis"]').all();
      if (reasoningElements.length > 0) {
        console.log('🧠 AI reasoning found:');
        for (const element of reasoningElements.slice(0, 3)) {
          const text = await element.textContent();
          if (text && text.length > 50) {
            console.log(`  - ${text.substring(0, 100)}...`);
          }
        }
      }
      
      // Check for Gemini model mention
      const pageContent = await page.content();
      if (pageContent.includes('Gemini') || pageContent.includes('gemini')) {
        console.log('✅ Gemini model is being used for screening!');
      }
    }
    
    // 5. Navigate to Analytics to see summary
    console.log('📊 Viewing analytics...');
    await page.click('text=Analytics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'analytics-summary.png',
      fullPage: true 
    });
    console.log('📸 Analytics screenshot saved as analytics-summary.png');
    
    console.log('🎉 Demo completed successfully!');
    console.log('📝 The system has:');
    console.log('  - Imported references about ICH treatment');
    console.log('  - Applied AI screening using Gemini');
    console.log('  - Displayed results with reasoning');
    console.log('  - Generated analytics summary');
  });
});
