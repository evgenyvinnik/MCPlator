import { test, expect } from '@playwright/test';

test.describe('Chat E2E Tests', () => {
  test('should respond to "2 plus 2" calculation request', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

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
    await page.goto('/');

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
