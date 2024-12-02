module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
    "plugin:prettier/recommended", // Enable Prettier integration
  ],
  ignorePatterns: ["dist", ".eslintrc.cjs"],
  parser: "@typescript-eslint/parser", // Parse TypeScript files
  plugins: ["react-refresh", "prettier"], // Add Prettier plugin
  rules: {
    "linebreak-style": ["error", "windows"],
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
    "max-len": [
      "error",
      {
        code: 100, // Set the maximum line length
        comments: 100, // Set the maximum line length for comments
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true,
      },
    ],
    "indent": ["error", 4], // Set indentation to 4 spaces
    "@typescript-eslint/indent": ["error", 4], // Ensure 4 spaces indentation for TypeScript files
  },
};
