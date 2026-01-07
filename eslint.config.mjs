import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Downgrade unused vars to warning (lots of pre-existing issues)
      "@typescript-eslint/no-unused-vars": "warn",
      // Allow img elements (card images come from external source)
      "@next/next/no-img-element": "warn",
      // Allow any in some cases
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow let for reassignment flexibility
      "prefer-const": "warn",
    },
  },
];

export default eslintConfig;
