// eslint.config.js
const { FlatCompat } = require("@eslint/eslintrc");
const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const globals = require("globals");

const compat = new FlatCompat({
  baseDirectory: process.cwd(),
});

module.exports = [
  // Convert the legacy eslint-config-standard configuration
  ...compat.extends("standard"),

  {
    files: [
      "src/js/**/*.ts",
      "src/js-bootstrap/**/*.ts",
    ],

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },

    plugins: {
      "@typescript-eslint": tsPlugin,
    },

    rules: {
      "prefer-promise-reject-errors": "off",
    },
  },

  {
    ignores: [
      "src/littlefs.js",
      "node_modules/**",
      "build/**",
    ],
  },
];
