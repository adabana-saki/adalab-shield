/**
 * i18n Translation Completeness Check Script
 * Validates that all locales have all required translation keys
 */

import * as fs from 'fs';
import * as path from 'path';

const LOCALES_DIR = 'public/_locales';
const BASE_LOCALE = 'en';

interface MessageEntry {
  message: string;
  description?: string;
  placeholders?: Record<
    string,
    {
      content: string;
      example?: string;
    }
  >;
}

interface MessagesFile {
  [key: string]: MessageEntry;
}

interface LocaleStats {
  total: number;
  translated: number;
  percentage: number;
}

interface Report {
  complete: boolean;
  missing: Record<string, string[]>;
  stats: Record<string, LocaleStats>;
  errors: string[];
}

function readMessagesFile(localePath: string): MessagesFile | null {
  const filePath = path.join(localePath, 'messages.json');

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content) as MessagesFile;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return null;
  }
}

function validateMessageEntry(
  key: string,
  entry: unknown,
  locale: string
): string[] {
  const errors: string[] = [];

  if (typeof entry !== 'object' || entry === null) {
    errors.push(`[${locale}] "${key}": Invalid entry format`);
    return errors;
  }

  const obj = entry as Record<string, unknown>;

  if (typeof obj.message !== 'string') {
    errors.push(`[${locale}] "${key}": Missing or invalid "message" property`);
  } else if (obj.message.trim() === '') {
    errors.push(`[${locale}] "${key}": Empty message`);
  }

  // Check placeholders if present
  if (obj.placeholders !== undefined) {
    if (typeof obj.placeholders !== 'object' || obj.placeholders === null) {
      errors.push(`[${locale}] "${key}": Invalid placeholders format`);
    } else {
      const placeholders = obj.placeholders as Record<string, unknown>;
      for (const [placeholderKey, placeholder] of Object.entries(
        placeholders
      )) {
        if (
          typeof placeholder !== 'object' ||
          placeholder === null ||
          typeof (placeholder as Record<string, unknown>).content !== 'string'
        ) {
          errors.push(
            `[${locale}] "${key}": Invalid placeholder "${placeholderKey}"`
          );
        }
      }
    }
  }

  return errors;
}

function checkTranslations(): Report {
  const report: Report = {
    complete: true,
    missing: {},
    stats: {},
    errors: [],
  };

  // Check if locales directory exists
  if (!fs.existsSync(LOCALES_DIR)) {
    report.errors.push(`Locales directory not found: ${LOCALES_DIR}`);
    report.complete = false;
    return report;
  }

  // Read base locale
  const baseLocalePath = path.join(LOCALES_DIR, BASE_LOCALE);
  const baseMessages = readMessagesFile(baseLocalePath);

  if (!baseMessages) {
    report.errors.push(`Base locale (${BASE_LOCALE}) messages.json not found`);
    report.complete = false;
    return report;
  }

  const baseKeys = new Set(Object.keys(baseMessages));

  // Validate base locale entries
  for (const [key, entry] of Object.entries(baseMessages)) {
    const errors = validateMessageEntry(key, entry, BASE_LOCALE);
    report.errors.push(...errors);
  }

  // Get all locale directories
  const locales = fs
    .readdirSync(LOCALES_DIR)
    .filter((f) => {
      const stat = fs.statSync(path.join(LOCALES_DIR, f));
      return stat.isDirectory();
    })
    .filter((f) => f !== BASE_LOCALE);

  // Check each locale
  for (const locale of locales) {
    const localePath = path.join(LOCALES_DIR, locale);
    const messages = readMessagesFile(localePath);

    if (!messages) {
      report.errors.push(`[${locale}] messages.json not found or invalid`);
      report.missing[locale] = [...baseKeys];
      report.stats[locale] = {
        total: baseKeys.size,
        translated: 0,
        percentage: 0,
      };
      report.complete = false;
      continue;
    }

    const localeKeys = new Set(Object.keys(messages));

    // Find missing keys
    const missing = [...baseKeys].filter((k) => !localeKeys.has(k));
    report.missing[locale] = missing;

    // Calculate stats
    report.stats[locale] = {
      total: baseKeys.size,
      translated: baseKeys.size - missing.length,
      percentage: Math.round(
        ((baseKeys.size - missing.length) / baseKeys.size) * 100
      ),
    };

    if (missing.length > 0) {
      report.complete = false;
    }

    // Validate each entry
    for (const [key, entry] of Object.entries(messages)) {
      const errors = validateMessageEntry(key, entry, locale);
      report.errors.push(...errors);
    }

    // Check for extra keys (not in base)
    const extraKeys = [...localeKeys].filter((k) => !baseKeys.has(k));
    if (extraKeys.length > 0) {
      report.errors.push(
        `[${locale}] Extra keys not in base: ${extraKeys.join(', ')}`
      );
    }
  }

  return report;
}

function printReport(report: Report): void {
  console.log('\n📊 Translation Completeness Report\n');
  console.log('═'.repeat(60));

  // Print stats table
  console.log('\n📈 Coverage Statistics:\n');
  console.log('| Locale   | Progress                    | Missing |');
  console.log('|----------|-----------------------------|---------:|');

  for (const [locale, stats] of Object.entries(report.stats)) {
    const barFilled = Math.floor(stats.percentage / 5);
    const barEmpty = 20 - barFilled;
    const bar = '█'.repeat(barFilled) + '░'.repeat(barEmpty);
    const missing = report.missing[locale]?.length ?? 0;
    console.log(
      `| ${locale.padEnd(8)} | ${bar} ${String(stats.percentage).padStart(3)}% | ${String(missing).padStart(7)} |`
    );
  }

  // Print missing keys details
  for (const [locale, missingKeys] of Object.entries(report.missing)) {
    if (missingKeys.length > 0) {
      console.log(`\n❌ Missing in ${locale}:`);
      for (const key of missingKeys.slice(0, 10)) {
        console.log(`   - ${key}`);
      }
      if (missingKeys.length > 10) {
        console.log(`   ... and ${missingKeys.length - 10} more`);
      }
    }
  }

  // Print errors
  if (report.errors.length > 0) {
    console.log('\n⚠️  Validation Errors:\n');
    for (const error of report.errors.slice(0, 20)) {
      console.log(`   ${error}`);
    }
    if (report.errors.length > 20) {
      console.log(`   ... and ${report.errors.length - 20} more errors`);
    }
  }

  console.log('\n' + '═'.repeat(60));

  if (report.complete && report.errors.length === 0) {
    console.log('✅ All translations are complete and valid!\n');
  } else {
    console.log('❌ Some translations are incomplete or have errors!\n');
  }
}

// Run the check
const report = checkTranslations();
printReport(report);

// Exit with error code if incomplete
if (!report.complete || report.errors.length > 0) {
  process.exit(1);
}
