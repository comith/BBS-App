import nextCoreWebVitals from "eslint-config-next/core-web-vitals.js";
import nextTypescript from "eslint-config-next/typescript.js";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
  rules: {
    // Disable console in production
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",

    // TypeScript specific rules
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-explicit-any": "off",

    // React specific rules
    "react-hooks/exhaustive-deps": "warn",
    "react/no-unescaped-entities": "off",

    // General code quality
    "prefer-const": "warn",
    "no-var": "error",
  },
}, {
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"]
}];

export default eslintConfig;
