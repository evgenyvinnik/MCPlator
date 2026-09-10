/**
 * Capture the real calculator UI for the About page.
 * Run the dev server first, then:
 * FFMPEG_PATH=/path/to/ffmpeg node scripts/capture-about-media.mjs
 *
 * Sample SSE responses keep recordings reproducible and make no paid API calls.
 * The app's normal chat, calculator engine, and animation runner do the work.
 */
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import LZString from 'lz-string';

const baseUrl = process.env.ABOUT_CAPTURE_URL || 'http://127.0.0.1:5173';
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
const output = resolve('public/about');
const temp = await mkdtemp(join(tmpdir(), 'mcplator-capture-'));
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
await mkdir(output, { recursive: true });

const examples = [
  {
    name: 'percentage',
    prompt: 'What is 15% of 80?',
    keys: [
      'ac',
      'digit_8',
      'digit_0',
      'mul',
      'digit_1',
      'digit_5',
      'percent',
      'equals',
    ],
    answer: '15% of 80 is 12.',
  },
  {
    name: 'discount',
    prompt: 'Take 20% off 150.',
    keys: [
      'ac',
      'digit_1',
      'digit_5',
      'digit_0',
      'sub',
      'digit_2',
      'digit_0',
      'percent',
      'equals',
    ],
    answer: '20% of 150 is 30. Subtracting the discount leaves 120.',
  },
  {
    name: 'sharing',
    prompt: 'Divide 84 by 4.',
    keys: ['ac', 'digit_8', 'digit_4', 'div', 'digit_4', 'equals'],
    answer: '84 divided by 4 is 21.',
  },
];

const browser = await chromium.launch();
async function screenshot(page, filename, clip) {
  const png = await page.screenshot({ clip });
  await sharp(png).webp({ quality: 86 }).toFile(join(output, filename));
}

try {
  for (const example of examples) {
    const viewport = { width: 1100, height: 780 };
    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: 1,
      recordVideo: { dir: temp, size: viewport },
      serviceWorkers: 'block',
    });
    const recordingStart = Date.now();
    const page = await context.newPage();
    await page.route('**/api/chat', async (route) => {
      await delay(550);
      const events = [
        ['token', { token: example.answer }],
        ['keys', { keys: example.keys }],
        [
          'done',
          { messageId: `demo-${example.name}`, fullText: example.answer },
        ],
      ];
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: events
          .map(
            ([type, payload]) =>
              `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`
          )
          .join(''),
      });
    });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    // Keep decorative background motion from adding noise to the recording.
    // Calculator presses use the app's normal imperative animation and still run.
    await page.addStyleTag({
      content: '*, *::before, *::after { animation: none !important; }',
    });
    const calculator = page
      .getByAltText('Casio Logo')
      .locator('..')
      .locator('..');
    const bounds = await calculator.boundingBox();
    const clip = {
      x: Math.floor(bounds.x - 20),
      y: Math.floor(bounds.y - 20),
      width: 360,
      height: 580,
    };
    let start = (Date.now() - recordingStart) / 1000;

    if (example.name === 'sharing') {
      await page.goto(
        `${baseUrl}/?lmcify=${LZString.compressToEncodedURIComponent(example.prompt)}`
      );
      await page.addStyleTag({
        content: '*, *::before, *::after { animation: none !important; }',
      });
      start = (Date.now() - recordingStart) / 1000;
    } else {
      const input = page.getByPlaceholder('Type your message...');
      await input.pressSequentially(example.prompt, { delay: 65 });
      await delay(500);
      // Calculator-only clips start just before the AI's key sequence.
      start = (Date.now() - recordingStart) / 1000;
      await input.press('Enter');
    }

    await page.getByText('Result', { exact: true }).waitFor();
    await delay(1800);
    const duration = (Date.now() - recordingStart) / 1000 - start;
    await page.mouse.move(0, 0);
    const videoClip =
      example.name === 'sharing'
        ? { x: 140, y: 0, width: 960, height: 780 }
        : clip;
    await screenshot(page, `${example.name}-poster.webp`, videoClip);

    if (example.name === 'percentage') {
      await screenshot(page, 'desktop.webp');
      const screen = calculator.locator('[class*="screenContainer"]').first();
      const screenBounds = await screen.boundingBox();
      await screenshot(page, 'display.webp', screenBounds);
      await screenshot(page, 'memory-keys.webp', {
        x: bounds.x + 8,
        y: bounds.y + 245,
        width: 304,
        height: 168,
      });
    }

    const recording = await page.video().path();
    await context.close();
    execFileSync(ffmpeg, [
      '-y',
      '-hide_banner',
      '-loglevel',
      'error',
      '-ss',
      String(start),
      '-i',
      recording,
      '-t',
      String(duration),
      '-vf',
      `crop=${videoClip.width}:${videoClip.height}:${videoClip.x}:${videoClip.y}`,
      '-r',
      '20',
      '-an',
      '-c:v',
      'libvpx',
      '-b:v',
      '400k',
      '-crf',
      '12',
      '-deadline',
      'realtime',
      '-cpu-used',
      '8',
      '-threads',
      '2',
      join(output, `${example.name}.webm`),
    ]);
    console.log(`Recorded ${example.name}: ${duration.toFixed(1)} seconds`);
  }

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    serviceWorkers: 'block',
  });
  await mobile.goto(baseUrl, { waitUntil: 'networkidle' });
  await mobile.evaluate(() => document.fonts.ready);
  for (const key of ['8', '4', '÷', '4', '=']) {
    await mobile.getByRole('button', { name: key, exact: true }).click();
  }
  await mobile.mouse.move(0, 0);
  await screenshot(mobile, 'mobile.webp');
  console.log(
    'Captured desktop, mobile, display, memory keys, and video posters.'
  );
} finally {
  await browser.close();
  await rm(temp, { recursive: true, force: true });
}
