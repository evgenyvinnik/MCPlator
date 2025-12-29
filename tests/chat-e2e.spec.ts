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

    // Wait for AI response - look for an assistant message or result card with actual text content
    // The assistant messages appear after user messages in the chat flow
    // Give it 60 seconds since LLM + calculator execution can be slow

    // Wait for either:
    // 1. A result card with "Result" label (calculator output)
    // 2. An assistant message containing relevant text
    const resultCard = page.locator('text=Result').first();
    const assistantMessage = page.locator('.bg-white\\/10').filter({
      hasText: /4|four|calculating|result|equals|let me|I('ll| will)/i
    }).first();

    // Wait for either response type
    await expect(resultCard.or(assistantMessage)).toBeVisible({ timeout: 60000 });

    // Debug: Take screenshot after response
    await page.screenshot({ path: 'test-results/debug-after-response.png', fullPage: true });

    // Get the response text from whichever element is visible
    let responseText = '';
    if (await resultCard.isVisible()) {
      // If result card is visible, get its parent card content
      responseText = await resultCard.locator('..').textContent() || '';
      console.log('Found result card:', responseText);
    } else if (await assistantMessage.isVisible()) {
      responseText = await assistantMessage.textContent() || '';
      console.log('Found assistant message:', responseText);
    }

    expect(responseText).toBeTruthy();
    console.log('Response text:', responseText);

    // The response should mention the calculation or result
    expect(responseText.toLowerCase()).toMatch(/4|four|calculating|result|equals/i);
  });

  test('should handle multiple chat messages', async ({ page }) => {
    // Debug: Log API requests
    page.on('response', async (response) => {
      if (response.url().includes('/api/')) {
        console.log('<< API Response:', response.status(), response.url());
      }
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    // Wait for chat to be ready
    await expect(page.getByText('AI Assistant')).toBeVisible({ timeout: 10000 });

    const chatInput = page.getByPlaceholder('Type your message...');
    await expect(chatInput).toBeVisible();

    // First message: 5 plus 3
    await chatInput.fill('5 plus 3');
    const sendButton = page.locator('button').filter({ has: page.locator('svg') }).last();
    await sendButton.click();

    // Wait for first response - either result card or assistant message with relevant content
    const firstResultCard = page.locator('text=Result').first();
    const firstAssistantMsg = page.locator('.bg-white\\/10').filter({
      hasText: /8|eight|calculating|result|equals|let me|I('ll| will)/i
    }).first();
    await expect(firstResultCard.or(firstAssistantMsg)).toBeVisible({ timeout: 60000 });
    console.log('First response received');

    // Second message: 10 minus 2
    await chatInput.fill('10 minus 2');
    await sendButton.click();

    // Wait for second response
    // Count result cards - should have 2 after second message
    await expect(async () => {
      const resultCards = page.locator('text=Result');
      const count = await resultCards.count();
      expect(count).toBeGreaterThanOrEqual(2);
    }).toPass({ timeout: 60000 });
    console.log('Second response received');

    // Verify we have at least 2 user messages in the chat
    const userMessages = page.locator('.bg-cyan-600\\/80');
    const count = await userMessages.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });
});
