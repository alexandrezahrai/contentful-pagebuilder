// Validate environment variables early
if (!import.meta.env.CONTENTFUL_SPACE_ID) {
  throw new Error('Missing CONTENTFUL_SPACE_ID');
}

if (!import.meta.env.CONTENTFUL_DELIVERY_TOKEN && !import.meta.env.CONTENTFUL_PREVIEW_TOKEN) {
  throw new Error('Missing Contentful API tokens');
}

export const CONTENTFUL_SPACE_ID = import.meta.env.CONTENTFUL_SPACE_ID;
export const CONTENTFUL_ENVIRONMENT = import.meta.env.CONTENTFUL_ENVIRONMENT || 'master';

export const CONTENTFUL_DELIVERY_TOKEN = import.meta.env.CONTENTFUL_DELIVERY_TOKEN;

export const CONTENTFUL_PREVIEW_TOKEN = import.meta.env.CONTENTFUL_PREVIEW_TOKEN;

/**
 * Shared Contentful GraphQL fetcher
 */
export async function fetchContentful<T = any, V = Record<string, any>>(
  query: string,
  variables?: V,
  options?: {
    preview?: boolean; // manually force preview if needed
    logErrors?: boolean; // enable/disable error logging
  }
): Promise<T> {
  const preview = options?.preview ?? false;
  const token = preview ? CONTENTFUL_PREVIEW_TOKEN : CONTENTFUL_DELIVERY_TOKEN;

  const endpoint = `https://graphql.contentful.com/content/v1/spaces/${CONTENTFUL_SPACE_ID}/environments/${CONTENTFUL_ENVIRONMENT}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();

  if (json.errors?.length) {
    if (options?.logErrors !== false) {
      console.error('Contentful GraphQL errors:');
      for (const err of json.errors) {
        console.error(`- ${err.message}`);
      }
    }
    throw new Error('Contentful GraphQL query failed');
  }

  return json.data as T;
}
