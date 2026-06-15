// @ts-check
/**
 * ESLint 9 flat config.
 *
 * Migrated from .eslintrc.cjs using the official @eslint/eslintrc FlatCompat
 * shim, so the rule set is preserved verbatim. The base config is scoped to
 * TypeScript sources; the two former `overrides` become standalone flat blocks.
 */

import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

const base = {
  env: {
    browser: true,
    es2022: true,
    node: true,
    webextensions: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'plugin:security/recommended-legacy',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'security'],
  settings: {
    react: { version: 'detect' },
  },
  rules: {
    // Security rules - CRITICAL
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-non-literal-regexp': 'off',
    'security/detect-non-literal-fs-filename': 'off',
    'security/detect-object-injection': 'off',

    // TypeScript strict rules
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],

    // React rules
    'react/prop-types': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // Code quality
    'no-console': ['warn', { allow: ['warn', 'error', 'debug'] }],
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    eqeqeq: ['error', 'always'],
    curly: ['error', 'all'],
  },
};

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '**/*.config.js',
      'e2e/**',
      'playwright.config.ts',
      'public/**',
      '.eslintrc.cjs',
      'eslint.config.mjs',
    ],
  },
  // Base ruleset, scoped to TypeScript sources.
  ...compat.config(base).map((c) => ({
    ...c,
    files: ['**/*.ts', '**/*.tsx'],
  })),
  // Relaxed rules for test files (was an eslintrc override).
  {
    files: ['**/*.test.ts', '**/*.test.tsx', 'tests/**/*'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      'security/detect-object-injection': 'off',
    },
  },
  // Background worker and scripts log to console operationally.
  {
    files: ['src/background/**/*', 'scripts/**/*'],
    rules: {
      'no-console': 'off',
    },
  },
];
