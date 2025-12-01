import { HeroSectionFields, CallToActionSectionFields } from './fragments';

export const getPageBySlugQuery = `
  ${HeroSectionFields}
  ${CallToActionSectionFields}

  query PageBySlug($slug: String!) {
    pageCollection(where: { slug: $slug }, limit: 1) {
      items {
        title
        slug
        builderCollection {
          items {
            __typename
            ...HeroSectionFields
            ...CallToActionSectionFields
          }
        }
      }
    }
  }
`;
