import { FlatCompat } from "@eslint/eslintrc";
import checkFile from 'eslint-plugin-check-file';
import n from 'eslint-plugin-n';
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),
  {
    plugins: {
      'check-file': checkFile,
      'n': n
    },
    rules: {
      "prefer-arrow-callback": ["error"],
      "prefer-template": ["error"],
      "n/no-process-env": ["error"],
      "check-file/filename-naming-convention": [
        "error", 
        {
          "**/*.{ts,tsx}": "KEBAB_CASE"
        },
        {
          "ignoreMiddleExtensions": true
        }
      ],
      "check-file/folder-naming-convention": [
        "error",
        {
          "src/**/!(__tests__)": "KEBAB_CASE",
        },
      ]
    },
  },
];

export default eslintConfig;
