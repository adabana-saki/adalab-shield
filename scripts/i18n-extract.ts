/**
 * i18n String Extraction Script
 *
 * Extracts translation keys from source files and generates
 * a report of missing translations.
 *
 * Usage:
 *   pnpm i18n:extract
 */

import {
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
  existsSync,
} from 'fs';
import { resolve, join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

const SRC_DIR = resolve(rootDir, 'src');
const LOCALES_DIR = resolve(rootDir, 'public/_locales');
const BASE_LOCALE = 'en';

// Patterns to match i18n function calls
const I18N_PATTERNS = [
  /\bt\(\s*['"`]([^'"`]+)['"`]/g, // t('key') or t("key") or t(`key`)
  /getMessage\(\s*['"`]([^'"`]+)['"`]/g, // getMessage('key')
  /i18n\.getMessage\(\s*['"`]([^'"`]+)['"`]/g, // i18n.getMessage('key')
  /__MSG_([a-zA-Z0-9_]+)__/g, // __MSG_key__
];

interface ExtractionResult {
  keys: Set<string>;
  locations: Map<string, string[]>;
}

/**
 * Recursively get all TypeScript/TSX files
 */
function getSourceFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      if (entry !== 'node_modules' && entry !== 'dist') {
        files.push(...getSourceFiles(fullPath));
      }
    } else if (['.ts', '.tsx'].includes(extname(entry))) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Extract i18n keys from a file
 */
function extractKeysFromFile(filePath: string): Map<string, string[]> {
  const content = readFileSync(filePath, 'utf-8');
  const keys = new Map<string, string[]>();

  for (const pattern of I18N_PATTERNS) {
    // Reset regex state
    pattern.lastIndex = 0;

    let match;
    while ((match = pattern.exec(content)) !== null) {
      const key = match[1];
      if (key === undefined) {
        continue;
      }

      // Find line number
      const beforeMatch = content.substring(0, match.index);
      const lineNumber = beforeMatch.split('\n').length;

      const location = `${filePath}:${lineNumber}`;

      if (!keys.has(key)) {
        keys.set(key, []);
      }
      keys.get(key)!.push(location);
    }
  }

  return keys;
}

/**
 * Extract all i18n keys from source files
 */
function extractAllKeys(): ExtractionResult {
  const files = getSourceFiles(SRC_DIR);
  const allKeys = new Set<string>();
  const allLocations = new Map<string, string[]>();

  for (const file of files) {
    const fileKeys = extractKeysFromFile(file);

    for (const [key, locations] of fileKeys) {
      allKeys.add(key);

      if (!allLocations.has(key)) {
        allLocations.set(key, []);
      }
      allLocations.get(key)!.push(...locations);
    }
  }

  return { keys: allKeys, locations: allLocations };
}

/**
 * Load existing translations
 */
function loadTranslations(locale: string): Set<string> {
  const messagesPath = join(LOCALES_DIR, locale, 'messages.json');

  if (!existsSync(messagesPath)) {
    return new Set();
  }

  const content = readFileSync(messagesPath, 'utf-8');
  const messages = JSON.parse(content) as Record<string, unknown>;

  return new Set(Object.keys(messages));
}

/**
 * Generate missing keys report
 */
function generateReport(extracted: ExtractionResult): void {
  const baseKeys = loadTranslations(BASE_LOCALE);
  const locales = readdirSync(LOCALES_DIR).filter((f) =>
    statSync(join(LOCALES_DIR, f)).isDirectory()
  );

  console.log('\n📊 i18n Extraction Report\n');
  console.log('='.repeat(60));

  // Keys found in code but not in base locale
  const missingInBase = [...extracted.keys].filter((k) => !baseKeys.has(k));

  if (missingInBase.length > 0) {
    console.log('\n⚠️  Keys found in code but missing in base locale (en):\n');
    for (const key of missingInBase) {
      console.log(`  - ${key}`);
      const locations = extracted.locations.get(key) || [];
      for (const loc of locations.slice(0, 3)) {
        console.log(`      at ${loc}`);
      }
      if (locations.length > 3) {
        console.log(`      ... and ${locations.length - 3} more locations`);
      }
    }
  } else {
    console.log('\n✅ All keys in code are defined in base locale\n');
  }

  // Keys in base locale but not found in code (potentially unused)
  const unusedKeys = [...baseKeys].filter((k) => !extracted.keys.has(k));

  if (unusedKeys.length > 0) {
    console.log(
      '\n⚠️  Keys in base locale but not found in code (potentially unused):\n'
    );
    for (const key of unusedKeys) {
      console.log(`  - ${key}`);
    }
    console.log(
      '\n  Note: Some keys may be used dynamically or in manifest.json'
    );
  }

  // Summary by locale
  console.log('\n📈 Translation Coverage:\n');
  console.log('| Locale | Defined | Missing | Coverage |');
  console.log('|--------|---------|---------|----------|');

  for (const locale of locales) {
    const localeKeys = loadTranslations(locale);
    const missing = [...baseKeys].filter((k) => !localeKeys.has(k)).length;
    const coverage =
      baseKeys.size > 0
        ? Math.round(((baseKeys.size - missing) / baseKeys.size) * 100)
        : 100;

    console.log(
      `| ${locale.padEnd(6)} | ${String(localeKeys.size).padEnd(7)} | ${String(missing).padEnd(7)} | ${String(coverage).padEnd(7)}% |`
    );
  }

  console.log('\n' + '='.repeat(60));

  // Export missing keys as JSON template
  if (missingInBase.length > 0) {
    const template: Record<string, { message: string; description: string }> =
      {};

    for (const key of missingInBase) {
      template[key] = {
        message: `[TODO: Translate ${key}]`,
        description: `Found in: ${(extracted.locations.get(key) || []).slice(0, 2).join(', ')}`,
      };
    }

    const outputPath = join(rootDir, 'missing-translations.json');
    writeFileSync(outputPath, JSON.stringify(template, null, 2));
    console.log(
      `\n📄 Missing keys template written to: missing-translations.json\n`
    );
  }
}

// Main execution
const extracted = extractAllKeys();
console.log(`\nFound ${extracted.keys.size} unique i18n keys in source files`);
generateReport(extracted);
