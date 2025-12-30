import { test, expect } from '@playwright/test';

test.describe('Calculator UI Tests', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  /**
   * Helper to get the calculator display value by reading digit elements
   * Reconstructs the display value from individual digit containers
   */
  async function getDisplayValue(page: import('@playwright/test').Page): Promise<string> {
    const displayContainer = page.locator('[class*="displayValue"]').first();
    const digitContainers = displayContainer.locator('[class*="digitContainer"]');
    const count = await digitContainers.count();

    let value = '';
    for (let i = 0; i < count; i++) {
      const container = digitContainers.nth(i);
      // Get the digit character from the span
      const digitSpan = container.locator('span[class*="digit"]');
      const digit = await digitSpan.textContent();
      value += digit || '';

      // Check if this digit has a visible decimal point after it
      const decimalPoint = container.locator('[class*="decimalPoint"][class*="visible"]');
      if ((await decimalPoint.count()) > 0) {
        value += '.';
      }
    }

    return value;
  }

  /**
   * Helper to click a calculator button by its label
   * Uses exact text matching to avoid ambiguity (e.g., '+' vs 'M+')
   */
  async function clickButton(page: import('@playwright/test').Page, label: string) {
    // For single character labels (operators, digits), use exact matching
    // The locator needs to find a button whose text content is exactly the label
    const button = page.locator('button').filter({ hasText: new RegExp(`^${escapeRegex(label)}$`) });
    await button.click();
  }

  /**
   * Escape special regex characters in a string
   */
  function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  test('should display initial value of 0', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const display = await getDisplayValue(page);
    expect(display).toBe('0');
  });

  test('should perform basic addition: 2 + 3 = 5', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    await clickButton(page, '2');
    await clickButton(page, '+');
    await clickButton(page, '3');
    await clickButton(page, '=');

    const display = await getDisplayValue(page);
    expect(display).toBe('5');
  });

  test('should perform basic subtraction: 9 - 4 = 5', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    await clickButton(page, '9');
    await clickButton(page, '−');
    await clickButton(page, '4');
    await clickButton(page, '=');

    const display = await getDisplayValue(page);
    expect(display).toBe('5');
  });

  test('should perform basic multiplication: 6 × 7 = 42', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    await clickButton(page, '6');
    await clickButton(page, '✕');
    await clickButton(page, '7');
    await clickButton(page, '=');

    const display = await getDisplayValue(page);
    expect(display).toBe('42');
  });

  test('should perform basic division: 8 ÷ 2 = 4', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    await clickButton(page, '8');
    await clickButton(page, '÷');
    await clickButton(page, '2');
    await clickButton(page, '=');

    const display = await getDisplayValue(page);
    expect(display).toBe('4');
  });

  test('should handle decimal numbers: 1.5 + 2.5 = 4', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    await clickButton(page, '1');
    await clickButton(page, '⋅'); // decimal point
    await clickButton(page, '5');
    await clickButton(page, '+');
    await clickButton(page, '2');
    await clickButton(page, '⋅');
    await clickButton(page, '5');
    await clickButton(page, '=');

    const display = await getDisplayValue(page);
    expect(display).toBe('4');
  });

  test('should clear display with AC button', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    await clickButton(page, '5');
    await clickButton(page, '5');
    await clickButton(page, '5');

    let display = await getDisplayValue(page);
    expect(display).toBe('555');

    await clickButton(page, 'AC');

    display = await getDisplayValue(page);
    expect(display).toBe('0');
  });

  test('should clear entry with C button', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    await clickButton(page, '1');
    await clickButton(page, '2');
    await clickButton(page, '3');
    await clickButton(page, 'C');

    const display = await getDisplayValue(page);
    expect(display).toBe('0');
  });

  test('should show error on division by zero', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    await clickButton(page, '5');
    await clickButton(page, '÷');
    await clickButton(page, '0');
    await clickButton(page, '=');

    const display = await getDisplayValue(page);
    expect(display).toBe('E');
  });

  test('should calculate percentage: 50% = 0.5', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    await clickButton(page, '5');
    await clickButton(page, '0');
    await clickButton(page, '%');

    const display = await getDisplayValue(page);
    expect(display).toBe('0.5');
  });

  test('should calculate square root: √16 = 4', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    await clickButton(page, '1');
    await clickButton(page, '6');

    // Click the sqrt button (has an img with alt="sqrt")
    await page.locator('button:has(img[alt="sqrt"])').click();

    const display = await getDisplayValue(page);
    expect(display).toBe('4');
  });

  test('should chain operations: 2 + 3 + 4 = 9', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    await clickButton(page, '2');
    await clickButton(page, '+');
    await clickButton(page, '3');
    await clickButton(page, '+');

    // After pressing + the second time, should show intermediate result 5
    let display = await getDisplayValue(page);
    expect(display).toBe('5');

    await clickButton(page, '4');
    await clickButton(page, '=');

    display = await getDisplayValue(page);
    expect(display).toBe('9');
  });

  test('should handle multi-digit numbers', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    await clickButton(page, '1');
    await clickButton(page, '2');
    await clickButton(page, '3');
    await clickButton(page, '4');

    const display = await getDisplayValue(page);
    expect(display).toBe('1234');
  });
});
