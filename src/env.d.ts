declare module "*.gql" {
  const query: string;
  export default query;
}

declare module "*.graphql" {
  const query: string;
  export default query;
}

interface ImportMetaEnv {
  readonly CONTENTFUL_SPACE_ID: string;
  readonly CONTENTFUL_DELIVERY_TOKEN: string;
  readonly CONTENTFUL_PREVIEW_TOKEN: string;
  readonly CONTENTFUL_ENVIRONMENT: string;
  readonly GRAPHQL_API_URL: string;
}
