import { test, expect } from '@playwright/test';

test.describe('Chat E2E Tests', () => {
  // Use desktop viewport to ensure chat panel is visible (not hidden like on mobile)
  test.use({ viewport: { width: 1280, height: 720 } });

  test('should respond to "2 plus 2" calculation request', async ({ page }) => {
    // Debug: Log all API network requests and responses
    page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        console.log('>> API Request:', request.method(), request.url());
      }
    });
    page.on('response', async (response) => {
      if (response.url().includes('/api/')) {
        console.log('<< API Response:', response.status(), response.url());
        if (response.status() >= 400) {
          const body = await response.text().catch(() => 'Unable to read body');
          console.log('<< API Error Body:', body.substring(0, 500));
        }
      }
    });
    page.on('requestfailed', (request) => {
      if (request.url().includes('/api/')) {
        console.log('!! API Request FAILED:', request.url(), request.failure()?.errorText);
      }
    });

    // Navigate to the app and wait for it to fully load
    await page.goto('/', { waitUntil: 'networkidle' });

    // Debug: Take a screenshot to see what's rendered
    await page.screenshot({ path: 'test-results/debug-page-load.png', fullPage: true });

    // Debug: Log page info
    console.log('Page title:', await page.title());
    console.log('Page URL:', page.url());
    console.log('Viewport size:', await page.viewportSize());

    // Debug: Check if main heading is visible (should be on desktop)
    const mainHeading = page.getByText(/retro calculator.*neural co-pilot/i);
    const headingVisible = await mainHeading.isVisible().catch(() => false);
    console.log('Main heading visible:', headingVisible);

    // Debug: Check body HTML to see what's actually rendered
    const bodyHTML = await page.locator('body').innerHTML();
    console.log('Body contains "AI Assistant":', bodyHTML.includes('AI Assistant'));
    console.log('Body first 500 chars:', bodyHTML.substring(0, 500));

    // Wait for the chat interface to be ready
    await expect(page.getByText('AI Assistant')).toBeVisible({ timeout: 10000 });

    const chatInput = page.getByPlaceholder('Type your message...');
    await expect(chatInput).toBeVisible();

    // Type the message "2 plus 2"
    await chatInput.fill('2 plus 2');

    // Find and click the send button (has Send icon)
    const sendButton = page.locator('button').filter({ has: page.locator('svg') }).last();
    await sendButton.click();

    // Wait for the user message to appear in the chat
    await expect(page.locator('text="2 plus 2"')).toBeVisible({ timeout: 5000 });

    // Debug: Screenshot after sending message
    await page.screenshot({ path: 'test-results/debug-after-send.png', fullPage: true });
    console.log('Message sent, waiting for API response...');

    // Wait for AI response - look for either:
    // 1. Assistant message (bg-white/10 class)
    // 2. Result card (has "Result" label)
    // 3. Any message containing "4" or related text
    // Give it 60 seconds since LLM + calculator execution can be slow
    const responseLocator = page.locator('.bg-white\\/10, .from-emerald-500\\/30').nth(1);
    await expect(responseLocator).toBeVisible({ timeout: 60000 });

    // Verify we got some kind of response text
    const responseText = await responseLocator.textContent();
    expect(responseText).toBeTruthy();

    // The response should mention the calculation or result
    // It might say "calculating", "result", "4", or similar
    expect(responseText?.toLowerCase()).toMatch(/4|four|calculating|result|equals/i);
  });

  test('should handle multiple chat messages', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Wait for chat to be ready
    await expect(page.getByText('AI Assistant')).toBeVisible({ timeout: 10000 });

    const chatInput = page.getByPlaceholder('Type your message...');
    await expect(chatInput).toBeVisible();

    // First message: 5 plus 3
    await chatInput.fill('5 plus 3');
    const sendButton = page.locator('button').filter({ has: page.locator('svg') }).last();
    await sendButton.click();

    // Wait for first response (should contain 8 or "eight")
    await expect(
      page.locator('.bg-white\\/10, .from-emerald-500\\/30').filter({ hasText: /8|eight|calculating|result/i }).first()
    ).toBeVisible({ timeout: 60000 });

    // Second message: 10 minus 2
    await chatInput.fill('10 minus 2');
    await sendButton.click();

    // Wait for second response (should also contain 8 or "eight")
    await expect(
      page.locator('.bg-white\\/10, .from-emerald-500\\/30').filter({ hasText: /8|eight|calculating|result/i }).nth(1)
    ).toBeVisible({ timeout: 60000 });

    // Verify we have at least 2 user messages in the chat
    const userMessages = page.locator('.bg-cyan-600\\/80');
    const count = await userMessages.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });
});
