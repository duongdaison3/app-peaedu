module.exports = [
  // ignore build and deps
  { ignores: ['.next/**', 'node_modules/**'] },

  // basic JS/TS rules with TypeScript parser
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: { '@typescript-eslint': require('@typescript-eslint/eslint-plugin') },
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
        ecmaFeatures: { jsx: true }
      }
    },
    rules: {
      'no-unused-vars': 'off',
      'no-undef': 'off'
    }
  }
]
