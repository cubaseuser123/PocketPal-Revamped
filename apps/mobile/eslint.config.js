import { config as base } from "@repo/eslint-config/react-internal";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  ...base,

  {
    plugins: {
      "react-refresh": reactRefresh,
    },
    rules: {
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
      "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
    },
  },

  {
    ignores: ["dist/**", "cypress.config.ts"],
  },
];
