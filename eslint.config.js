import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";

export default [
  {
    ignores: ["node_modules/", "assets/", "working-assets/js/splide.min.js"],
  },
  {
    files: ["working-assets/js/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        module: "readonly",
        customElements: "readonly",
        HTMLElement: "readonly",
        localStorage: "readonly",
        setTimeout: "readonly",
        console: "readonly",
        fetch: "readonly",
        CustomEvent: "readonly",
        DOMParser: "readonly",
        requestAnimationFrame: "readonly",
      },
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      "import/no-unresolved": "error",
    },
  },
];
