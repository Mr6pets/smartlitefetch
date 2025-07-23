import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node, // 添加 Node.js 全局，如 setTimeout 等
        URLSearchParams: 'readonly',
        AbortController: 'readonly',
        FormData: 'readonly',
        clearTimeout: 'readonly'
      },
      ecmaVersion: 'latest',
      sourceType: 'module' // 默认 ESM
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'error'
    }
  },
  {
    files: ['**/*.cjs'], // overrides for CommonJS files
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        module: 'writable',
        require: 'readonly'
      }
    }
  }
];