# Contentful + Astro Page Builder

A modular, type-safe **Lego-style page builder** where marketing users can create pages with reusable content blocks (Hero Banners, Feature Grids, CTAs, Galleries, Testimonials, etc.) without touching code.

Developers create **blocks**; marketers assemble **pages** using those blocks.

Built with:

- [Astro](https://astro.build/)
- [Contentful](https://www.contentful.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [GraphQL Codegen](https://www.graphql-code-generator.com/)

---

## Table of Contents

1. [Project Setup](#project-setup)
2. [Environment Variables](#environment-variables)
3. [Install Dependencies](#install-dependencies)
4. [Running the Project](#running-the-project)
5. [GraphQL Types (Codegen)](#graphql-types-codegen)
6. [Creating New Blocks](#creating-new-blocks)
7. [Folder Structure](#folder-structure)
8. [Tips & Best Practices](#tips--best-practices)

---

## Project Setup

1. Clone the repository:

```bash
git clone <repo-url>
cd contentful-pagebuilder
```

## Environment Variables

Create a .env file in the project root with your Contentful credentials:

```env
CONTENTFUL_SPACE_ID=your_space_id_here
CONTENTFUL_DELIVERY_TOKEN=your_delivery_token_here
CONTENTFUL_PREVIEW_TOKEN=your_preview_token_here
CONTENTFUL_ENVIRONMENT=master
GRAPHQL_API_URL=https://graphql.contentful.com/content/v1/spaces/<SPACE_ID>/environments/master
```

## Install Dependencies

```bash
npm install
```

## Running the Project

```bash
npm run dev
```

- Starts Astro dev server
- Open your browser at http://localhost:4321/

## GraphQL Types (Codegen)

1. Install Codegen packages (already included in this project):

```bash
npm install -D @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations @graphql-codegen/typescript-graphql-request
```

2. Run Codegen to generate TypeScript types:

```bash
npm run codegen
```

- Generates `src/generated/graphql.ts`
- Provides type safety for all Contentful fragments and queries

## Creating New Blocks

Follow this workflow to add a new reusable block (e.g., `ImageWithContent`):

### 1. Contentful Content Type

- Create a new **Content Type** for the block (e.g., `ImageWithContent`).
- Add only the fields the block needs (e.g., `title`, `description`, `image`).
- Publish it.

### 2. GraphQL Fragment

- Create `src/graphql/fragments/ImageWithContent.ts`:

```ts
export const ImageWithContentFields = `
fragment ImageWithContentFields on ImageWithContent {
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
```

- Export it in `src/graphql/fragments/index.ts`:

```ts
export { ImageWithContentFields } from './ImageWithContent';
```

### 3. Add to Page Query

Once your fragment is created, you need to include it in the main page query so Contentful knows to fetch it.

**Recommended approach:** import all fragments from the centralized `fragments/index.ts` file. This keeps a single source of truth and avoids scattered imports.

- In `src/graphql/getPageBySlug.ts`:

```ts
// src/graphql/getPageBySlug.ts

import {
  HeroSectionFields,
  CallToActionSectionFields,
  ImageWithContentFields, // New block
} from './fragments';

export const getPageBySlugQuery = `
  ${HeroSectionFields}
  ${CallToActionSectionFields}
  ${ImageWithContentFields}  # include all fragments your page may use

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
            ...ImageWithContentFields
          }
        }
      }
    }
  }
`;
```

### 4. Astro Component

- Create `src/components/blocks/ImageWithContent.astro`:

```astro
---
import { documentToHtmlString } from "@contentful/rich-text-html-renderer";

interface Props {
  title: string;
  description: any;
  image?: { url: string; description?: string };
}

const { title, description, image } = Astro.props;
const renderedDescription = documentToHtmlString(description?.json);
---

<section class="image-with-content">
  {image && <img src={image.url} alt={image.description ?? ''} />}
  <h2>{title}</h2>
  <article set:html={renderedDescription} />
</section>

```

### 5. Update `BlockRenderer.astro`

```ts
const BLOCKS: Record<string, string> = {
  HeroSection: './blocks/HeroSection.astro',
  CallToActionSection: './blocks/CallToActionSection.astro',
  // Add new blocks below
  ImageWithContent: './blocks/ImageWithContent.astro',
};
```

- No other changes are needed — dynamic import handles the rest

### 6. Add Block in Contentful

- In a Page entry, add the new block in the `builder` field
- Fill fields and publish
- Block renders automatically in Astro

## Folder Structure

```
src/
├── assets/                             # Images, SVGs, and other static assets
│ ├── astro.svg
│ └── background.svg
├── components/
│ ├── BlockRenderer.astro               # Dynamic block renderer
│ └── blocks/                           # Individual block components
├── env.d.ts                            # TypeScript declarations for environment variables
├── generated/                          # GraphQL Codegen output
│ └── graphql.ts
├── graphql/
│ ├── fragments/                        # Block GraphQL fragments
│ │ └── index.ts                        # Centralized export of all fragments
│ └── getPageBySlug.ts                  # GraphQL query for fetching page by slug
├── layouts/                            # Layout components
│ └── Layout.astro
├── lib/
│ └── contentful.ts                     # Shared Contentful fetch helper
├── pages/
│ ├── 404.astro                         # 404 page template
│ ├── [...slug].astro                   # Catch-all page route
│ └── index.astro                       # Home page
└── styles/
    └── global.css                      # Custom classes and Tailwind stuff goes here
```

## Tips & Best Practices

- **Type safety:** Always run `npm run codegen` after adding a new fragment. This keeps TypeScript types in sync with Contentful and prevents runtime errors.
- **Adding blocks:** Follow this simple workflow when creating new blocks:
  1. Create the block in Contentful.
  2. Create its GraphQL fragment in `src/graphql/fragments/`.
  3. Export it from `fragments/index.ts`.
  4. Create the corresponding Astro component in `src/components/blocks/`.
  5. Add the block to the `BLOCKS` map in `BlockRenderer.astro`.
  6. Run `npm run codegen` to update TypeScript types.
- **Dynamic imports:** `BlockRenderer.astro` dynamically imports each block based on its `__typename`. No changes to `[...slug].astro` are needed when adding new blocks.
- **Centralized fragments:** Always import fragments from `fragments/index.ts` to keep a single source of truth and simplify queries.
- **Marketing-friendly:** Editors can add, remove, or rearrange blocks in Contentful without touching code. Your page updates automatically.
- **Previewing changes:** Use `CONTENTFUL_PREVIEW_TOKEN` and set `preview: true` in fetchContentful calls to preview unpublished content safely.
- **Organizing blocks:** Keep each block self-contained and minimal—only include the fields it needs. This ensures modularity and reusability.
- **Consistency:** Follow the naming convention `PascalCase` for block content types, fragments, and Astro component files to avoid import mismatches.
- **Error handling:** Always check for missing blocks or unexpected `__typename` values. Use console warnings to debug missing or misnamed blocks in development.
