/**
 * Icon Generation Script
 *
 * Generates PNG icons from SVG source at required sizes.
 *
 * Requirements:
 *   - sharp: npm install -D sharp @types/sharp
 *
 * Usage:
 *   pnpm icons:generate
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

const ICON_SIZES = [16, 32, 48, 128];
const SVG_SOURCE = resolve(rootDir, 'public/icons/icon.svg');
const OUTPUT_DIR = resolve(rootDir, 'public/icons');

async function generateIcons(): Promise<void> {
  // Check if sharp is available
  let sharpModule:
    | {
        default: (input: Buffer) => {
          resize: (
            w: number,
            h: number
          ) => { png: () => { toFile: (path: string) => Promise<void> } };
        };
      }
    | undefined;
  try {
    // @ts-expect-error - sharp is optional and types may not be installed
    sharpModule = await import('sharp');
  } catch {
    console.log('Sharp not installed. Creating placeholder icons...');
    createPlaceholderIcons();
    return;
  }

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Read SVG source
  if (!existsSync(SVG_SOURCE)) {
    console.error(`SVG source not found: ${SVG_SOURCE}`);
    process.exit(1);
  }

  const svgBuffer = readFileSync(SVG_SOURCE);
  if (!sharpModule) {
    console.error('Sharp module not loaded');
    process.exit(1);
  }
  const sharp = sharpModule.default;

  // Generate each size
  for (const size of ICON_SIZES) {
    const outputPath = resolve(OUTPUT_DIR, `icon-${size}.png`);

    try {
      await sharp(svgBuffer).resize(size, size).png().toFile(outputPath);

      console.log(`Generated: icon-${size}.png`);
    } catch (error) {
      console.error(`Failed to generate icon-${size}.png:`, error);
    }
  }

  console.log('\nIcon generation complete!');
}

function createPlaceholderIcons(): void {
  // Create simple placeholder PNGs without sharp
  // These are minimal valid PNG files

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Minimal 1x1 blue PNG (base64 decoded)
  // This is a placeholder - replace with proper icons before release
  const minimalPng = Buffer.from([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a, // PNG signature
    0x00,
    0x00,
    0x00,
    0x0d,
    0x49,
    0x48,
    0x44,
    0x52, // IHDR chunk
    0x00,
    0x00,
    0x00,
    0x01,
    0x00,
    0x00,
    0x00,
    0x01, // 1x1 dimensions
    0x08,
    0x02,
    0x00,
    0x00,
    0x00,
    0x90,
    0x77,
    0x53,
    0xde,
    0x00,
    0x00,
    0x00,
    0x0c,
    0x49,
    0x44,
    0x41, // IDAT chunk
    0x54,
    0x08,
    0xd7,
    0x63,
    0x78,
    0xc1,
    0xf0,
    0x00, // Blue color
    0x00,
    0x00,
    0x04,
    0x00,
    0x01,
    0x5d,
    0x52,
    0x86,
    0xc5,
    0x00,
    0x00,
    0x00,
    0x00,
    0x49,
    0x45,
    0x4e, // IEND chunk
    0x44,
    0xae,
    0x42,
    0x60,
    0x82,
  ]);

  for (const size of ICON_SIZES) {
    const outputPath = resolve(OUTPUT_DIR, `icon-${size}.png`);
    writeFileSync(outputPath, minimalPng);
    console.log(
      `Created placeholder: icon-${size}.png (replace before release)`
    );
  }

  console.log('\nPlaceholder icons created.');
  console.log(
    'Install sharp (`pnpm add -D sharp`) and run again for proper icons.'
  );
}

// Run the script
generateIcons().catch(console.error);
