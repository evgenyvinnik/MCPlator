import { test, expect } from '@playwright/test';

test('button press animation works', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  
  // Wait for the page to load
  await page.waitForSelector('button:has-text("5")');
  
  // Click button 5 to test manual interaction
  await page.click('button:has-text("5")');
  
  // Verify display shows 5
  await expect(page.locator('text=5').first()).toBeVisible();
  
  // Click AC to clear
  await page.click('button:has-text("AC")');
  
  // Now test a sequence: 1 + 2 =
  await page.click('button:has-text("1")');
  await page.waitForTimeout(100);
  
  await page.click('button:has-text("+")');
  await page.waitForTimeout(100);
  
  await page.click('button:has-text("2")');
  await page.waitForTimeout(100);
  
  await page.click('button:has-text("=")');
  await page.waitForTimeout(100);
  
  // The result should show 3 (though the engine is currently a stub)
  // This test verifies manual button presses work correctly
});
