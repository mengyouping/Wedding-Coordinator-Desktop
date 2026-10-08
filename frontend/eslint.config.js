import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'src-tauri/target/**', 'reports/**', 'test-results/**'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: { projectService: false },
      globals: {
        window: 'readonly', document: 'readonly', location: 'readonly', history: 'readonly',
        localStorage: 'readonly', sessionStorage: 'readonly', indexedDB: 'readonly', crypto: 'readonly',
        File: 'readonly', Blob: 'readonly', URL: 'readonly', AbortController: 'readonly', Headers: 'readonly',
        RequestInit: 'readonly', DOMException: 'readonly', Event: 'readonly', FileList: 'readonly',
        HTMLInputElement: 'readonly', HTMLElement: 'readonly', NodeJS: 'readonly', process: 'readonly'
      }
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['error', { allow: ['warn', 'error'] }]
    }
  },
  {
    files: ['**/*.test.{ts,tsx}', 'tests/**/*.ts'],
    rules: { 'no-console': 'off' }
  }
);
