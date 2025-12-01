export const HeroSectionFields = `
fragment HeroSectionFields on HeroSection {
  __typename
  title
  description {
    json
  }
  image {
    url
    description
  }
}
`;
