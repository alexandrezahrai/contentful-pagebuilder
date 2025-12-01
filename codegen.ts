import type { CodegenConfig } from "@graphql-codegen/cli";
import { loadEnv } from "vite";

const { GRAPHQL_API_URL, CONTENTFUL_DELIVERY_TOKEN } = loadEnv(
  process.env.NODE_ENV || "development",
  process.cwd(),
  ""
);

const config: CodegenConfig = {
  schema: {
    [GRAPHQL_API_URL || ""]: {
      headers: {
        Authorization: `Bearer ${CONTENTFUL_DELIVERY_TOKEN}`,
      },
    },
  },
  documents: ["src/graphql/**/*.ts", "src/graphql/**/*.graphql"],
  ignoreNoDocuments: true,
  generates: {
    "./src/generated/graphql.ts": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-graphql-request",
      ],
      config: {
        preset: "client",
        rawRequest: true,
        useTypeImports: true,
        strictScalars: false,
      },
    },
  },
  hooks: {
    afterAllFileWrite: ["prettier --write"],
  },
};

export default config;
