// ESLint v9 flat config
// Uses the new flat config format — no .eslintrc files needed.
// Run: npm run lint        → check for violations
// Run: npm run lint:fix    → auto-fix where possible
//
// WHY v9 flat config:
// ESLint v8 pulled in deprecated glob@7, rimraf@3, inflight, etc.
// ESLint v9 with flat config has a clean dependency tree — zero deprecation warnings.

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';


export default tseslint.config(
  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript recommended rules
  ...tseslint.configs.recommended,

  // Project-specific config
  {
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
      import: importPlugin,   // ← add this line
    },

    settings: {
      react: { version: 'detect' },
    },

    rules: {
      // React hooks — must follow rules of hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // TypeScript
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // General code quality
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'prefer-const': 'warn',
      'no-var': 'error',
      'eqeqeq': ['warn', 'always'],
      'no-duplicate-imports': 'error',

      // Import organisation
      'import/order': ['warn', {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        alphabetize: { order: 'asc', caseInsensitive: true },
      }],
    },
  },

  // Ignore build outputs and config files
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'vite.config.ts',
      'eslint.config.js',
    ],
  }
);
