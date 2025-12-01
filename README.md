# Contentful + Astro Page Builder

A modular, type-safe **Lego-style page builder** where marketing users can create pages with reusable content blocks (Hero Banners, Feature Grids, CTAs, Galleries, Testimonials, etc.) without touching code.

Developers create **blocks**; marketers assemble **pages** using those blocks.

Built with:

- [Astro](https://astro.build/)
- [Contentful](https://www.contentful.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [GraphQL Codegen](https://www.graphql-code-generator.com/)

---

## Marketing User Quick Start

1. Log in to Contentful and select your space.
2. Create a new `Page` entry or edit an existing one.
3. Fill in the `title` and `slug`.
4. Add blocks using the `builder` reference field.
5. Fill out the fields for each block.
6. Rearrange blocks as desired.
7. Publish the page. No developer involvement needed.

## Table of Contents

1. [Project Setup](#project-setup)
2. [Environment Variables](#environment-variables)
3. [Install Dependencies](#install-dependencies)
4. [Running the Project](#running-the-project)
5. [Contentful Setup](#contentful-setup)
6. [GraphQL Types (Codegen)](#graphql-types-codegen)
7. [Creating New Blocks](#creating-new-blocks)
8. [Folder Structure](#folder-structure)
9. [Tips & Best Practices](#tips--best-practices)

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

## Contentful Setup

Before you can render pages in Astro, you need to set up the Contentful space with the proper content types and fields. This section ensures the CMS structure matches your page builder.

### Create the Page Content Type

- In Contentful, create a new `Content Type` called `Page`.
- Add the following fields:
  - `title` — Short text
  - `slug` — Short text (used in the URL)
  - `builder` — Reference field (allows multiple entries, references block content types)

**Note:** The `builder` field is the core of the page builder. Marketing users will use it to stack and reorder blocks.

### Marketing Workflow

Once content types exist:

- Editors create new `Page` entries.
- Fill the `title` and `slug` fields.
- Use the `builder` field to add, stack, and reorder blocks.
- Fill in block-specific fields.
- Publish the page.

**Notes:**

- No code changes are needed for new pages. As long as the block exists in Contentful and the Astro component is implemented, the page renders automatically.
- Marketing users can reorder blocks in the builder field, and the page in Astro will update automatically without code changes.

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

### Step 1: Contentful Content Type

- Create a new **Content Type** for the block (e.g., `ImageWithContent`).
- Add only the fields the block needs (e.g., `title`, `description`, `image`).
- Publish it.

Example:

**Image with Content**

- `title` — Short text
- `description` — Rich text
- `image` — Media

**Note:** Keep each block focused and modular. Each block should map directly to a single Astro component.

### Step 2: GraphQL Fragment

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

### Step 3: Run Codegen After Adding a Fragment

**Important:** After creating your new fragment and exporting it in `fragments/index.ts`, run:

```bash
npm run codegen
```

- This regenerates `src/generated/graphql.ts`
- Provides type safety for your new block
- Ensures IDE autocomplete works for the block’s fields

### Step 4: Add to Page Query

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

### Step 5: Astro Component

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

### Step 6: Update `BlockRenderer.astro`

```ts
const BLOCKS: Record<string, string> = {
  HeroSection: './blocks/HeroSection.astro',
  CallToActionSection: './blocks/CallToActionSection.astro',
  // Add new blocks below
  ImageWithContent: './blocks/ImageWithContent.astro',
};
```

- No other changes are needed — dynamic import handles the rest

### Step 7: Add Block in Contentful

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

- **Type safety:** Always run `npm run codegen` after adding a new fragment. This keeps TypeScript types in sync with Contentful and prevents runtime errors. Adding a new Astro component for an existing block type does not require codegen.
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
