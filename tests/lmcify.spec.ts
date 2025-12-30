import { test, expect } from '@playwright/test';

test.describe('LMCIFY URL Sharing Tests', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('should auto-play message from lmcify URL parameter', async ({
    page,
  }) => {
    // Correct lz-string encoded value for "5 plus 5"
    const lmcifyParam = 'KwAgDgNgrgzixA';
    await page.goto(`/?lmcify=${lmcifyParam}`, { waitUntil: 'networkidle' });

    const chatInput = page.getByPlaceholder('Type your message...');
    await expect(chatInput).toBeVisible({ timeout: 10000 });

    // The auto-play types the message then sends it
    // Wait for either the input to contain the message or a user message bubble
    await expect(async () => {
      const inputValue = await chatInput.inputValue();
      const userMessage = page.locator('text="5 plus 5"');
      const hasInput = inputValue.includes('5 plus 5');
      const hasUserMessage = await userMessage.isVisible().catch(() => false);
      expect(hasInput || hasUserMessage).toBe(true);
    }).toPass({ timeout: 20000 });
  });

  test('should handle invalid lmcify parameter gracefully', async ({
    page,
  }) => {
    await page.goto('/?lmcify=invalid_data!!!', { waitUntil: 'networkidle' });
    await expect(page.getByText('AI Assistant')).toBeVisible({ timeout: 10000 });
    const chatInput = page.getByPlaceholder('Type your message...');
    const inputValue = await chatInput.inputValue();
    expect(inputValue).toBe('');
  });
});
