/**
 * PWA Asset Generator Script
 *
 * Generates all required PWA icons, OG images, and Apple touch icons
 * from the SVG favicon.
 *
 * Usage: node scripts/generate-pwa-assets.js
 *
 * Requires: npm install sharp
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');
const SCREENSHOTS_DIR = path.join(PUBLIC_DIR, 'screenshots');
const SVG_PATH = path.join(PUBLIC_DIR, 'mcplator-favicon.svg');

// PWA icon sizes
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Ensure directories exist
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

// Generate a PWA icon at specified size
async function generateIcon(size) {
  const outputPath = path.join(ICONS_DIR, `icon-${size}x${size}.png`);

  await sharp(SVG_PATH)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(outputPath);

  console.log(`Generated: icon-${size}x${size}.png`);
}

// Generate Apple Touch Icon (180x180)
async function generateAppleTouchIcon() {
  const outputPath = path.join(PUBLIC_DIR, 'apple-touch-icon.png');

  await sharp(SVG_PATH)
    .resize(180, 180, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    })
    .png()
    .toFile(outputPath);

  console.log('Generated: apple-touch-icon.png');
}

// Generate OG Image (1200x630)
async function generateOGImage() {
  const outputPath = path.join(PUBLIC_DIR, 'og-image.png');

  // Create an OG image with the app branding
  // Dark gradient background with centered icon and text
  const width = 1200;
  const height = 630;
  const iconSize = 200;

  // Create the background with gradient
  const background = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0a0e1a"/>
          <stop offset="50%" style="stop-color:#1e1b4b"/>
          <stop offset="100%" style="stop-color:#0a0e1a"/>
        </linearGradient>
        <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#6366f1"/>
          <stop offset="50%" style="stop-color:#8b5cf6"/>
          <stop offset="100%" style="stop-color:#06b6d4"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bg)"/>
      <!-- Decorative circles -->
      <circle cx="150" cy="150" r="200" fill="#8b5cf6" opacity="0.1"/>
      <circle cx="1050" cy="480" r="250" fill="#06b6d4" opacity="0.1"/>
      <!-- Accent line -->
      <rect x="0" y="${height - 8}" width="${width}" height="8" fill="url(#accent)"/>
    </svg>
  `);

  // Read and resize the icon
  const icon = await sharp(SVG_PATH).resize(iconSize, iconSize).png().toBuffer();

  // Create text overlay
  const textOverlay = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .title {
          font-family: system-ui, -apple-system, sans-serif;
          font-weight: bold;
          fill: white;
        }
        .subtitle {
          font-family: system-ui, -apple-system, sans-serif;
          fill: #a5b4fc;
        }
      </style>
      <text x="${width / 2}" y="380" text-anchor="middle" class="title" font-size="72">MCPlator</text>
      <text x="${width / 2}" y="450" text-anchor="middle" class="subtitle" font-size="32">AI-Powered Calculator</text>
      <text x="${width / 2}" y="510" text-anchor="middle" class="subtitle" font-size="24">Calculate with natural language</text>
    </svg>
  `);

  // Composite all layers
  await sharp(background)
    .composite([
      {
        input: icon,
        top: 140,
        left: Math.floor((width - iconSize) / 2),
      },
      {
        input: textOverlay,
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toFile(outputPath);

  console.log('Generated: og-image.png');
}

// Generate desktop screenshot placeholder (1280x720)
async function generateDesktopScreenshot() {
  const outputPath = path.join(SCREENSHOTS_DIR, 'desktop.png');
  const width = 1280;
  const height = 720;

  const screenshot = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0a0e1a"/>
          <stop offset="50%" style="stop-color:#1e1b4b"/>
          <stop offset="100%" style="stop-color:#0a0e1a"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bg)"/>
      <text x="${width / 2}" y="${height / 2}" text-anchor="middle" font-family="system-ui" font-size="48" fill="white">MCPlator Desktop</text>
      <text x="${width / 2}" y="${height / 2 + 60}" text-anchor="middle" font-family="system-ui" font-size="24" fill="#a5b4fc">Replace with actual screenshot</text>
    </svg>
  `);

  await sharp(screenshot).png().toFile(outputPath);

  console.log('Generated: screenshots/desktop.png (placeholder)');
}

// Generate mobile screenshot placeholder (750x1334)
async function generateMobileScreenshot() {
  const outputPath = path.join(SCREENSHOTS_DIR, 'mobile.png');
  const width = 750;
  const height = 1334;

  const screenshot = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0a0e1a"/>
          <stop offset="50%" style="stop-color:#1e1b4b"/>
          <stop offset="100%" style="stop-color:#0a0e1a"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bg)"/>
      <text x="${width / 2}" y="${height / 2}" text-anchor="middle" font-family="system-ui" font-size="48" fill="white">MCPlator Mobile</text>
      <text x="${width / 2}" y="${height / 2 + 60}" text-anchor="middle" font-family="system-ui" font-size="24" fill="#a5b4fc">Replace with actual screenshot</text>
    </svg>
  `);

  await sharp(screenshot).png().toFile(outputPath);

  console.log('Generated: screenshots/mobile.png (placeholder)');
}

// Main function
async function main() {
  console.log('🎨 Generating PWA assets...\n');

  // Ensure directories exist
  ensureDir(ICONS_DIR);
  ensureDir(SCREENSHOTS_DIR);

  try {
    // Generate all PWA icons
    console.log('📱 Generating PWA icons...');
    for (const size of ICON_SIZES) {
      await generateIcon(size);
    }

    // Generate Apple Touch Icon
    console.log('\n🍎 Generating Apple Touch Icon...');
    await generateAppleTouchIcon();

    // Generate OG Image
    console.log('\n🖼️  Generating Open Graph image...');
    await generateOGImage();

    // Generate screenshot placeholders
    console.log('\n📸 Generating screenshot placeholders...');
    await generateDesktopScreenshot();
    await generateMobileScreenshot();

    console.log('\n✅ All assets generated successfully!');
    console.log('\n📝 Note: Replace the screenshot placeholders with actual app screenshots.');
  } catch (error) {
    console.error('❌ Error generating assets:', error);
    process.exit(1);
  }
}

main();
