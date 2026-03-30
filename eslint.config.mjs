import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: globals.node } },
  { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" },

  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'prefer-const': 'error',  //use const instead of let for constants
    'no-var': 'error',  // Disallow the use of var
    'quotes': ['error', 'single'], // Enforce single quotes
    'semi': ['error', 'always'], // Require semicolons at the end of statements
    'indent': ['error', 4] // Enforce 4-space indentation

  }
}
]);
