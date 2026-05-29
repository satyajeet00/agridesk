import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // react-hooks/set-state-in-effect was introduced in eslint-plugin-react-hooks@5 and
    // flags every "fetch data on mount" useEffect. Our dashboard pages legitimately do
    // client-side fetching there because they hold a JWT in localStorage that the server
    // components can't access. We will migrate to SWR / React Query when we add real-time
    // updates; until then this rule produces 6+ false positives.
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
