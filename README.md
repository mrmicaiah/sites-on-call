# Sites On Call - 11ty Static Site

This is the marketing website for Sites On Call, built with [Eleventy (11ty)](https://www.11ty.dev/).

## Project Structure

```
sites-on-call/
├── src/
│   ├── _includes/
│   │   └── layouts/
│   │       └── base.njk          # Shared HTML wrapper (nav, footer, head)
│   ├── _data/
│   │   └── articles.js           # Fetches articles from local MD files at build
│   ├── articles/
│   │   ├── posts/                # Markdown article files
│   │   ├── index.njk             # Article listing page (/articles/)
│   │   └── article.njk           # Individual article template
│   ├── css/
│   │   └── styles.css            # All site styles
│   ├── js/
│   │   └── main.js               # Interactive JS (nav, modal, forms)
│   ├── demos/                    # Client demo sites
│   ├── CNAME                     # Custom domain config
│   └── index.njk                 # Landing page
├── .eleventy.js                  # 11ty configuration
├── package.json                  # Dependencies
└── .gitignore
```

## Local Development

```bash
# Install dependencies
npm install

# Run development server (with hot reload)
npm run dev

# Build for production
npm run build
```

The built site outputs to `_site/`.

## Deployment

The site deploys to GitHub Pages via GitHub Actions. When you push to `main`:
1. GitHub runs `npm install` and `npm run build`
2. The `_site/` folder is deployed to GitHub Pages

**IMPORTANT:** The workflow also needs a scheduled daily rebuild for future-dated articles to go live automatically. See the workflow section below.

## Articles / Blog

Articles are stored as Markdown files in `src/articles/posts/`. The frontmatter should include:

```yaml
---
title: "Article Title"
excerpt: "Brief description"
author: "Irene Daniels"
date: 2026-03-22
tags:
  - contractor marketing
  - lead generation
---
```

**Future-dated articles:** Articles with dates in the future won't appear until the site rebuilds AFTER that date. The workflow includes a daily scheduled rebuild at 6 AM UTC to handle this.

## GitHub Actions Workflow

The workflow should include a scheduled trigger for article publishing:

**File:** `.github/workflows/build.yml`

```yaml
name: Build and Deploy 11ty Site

on:
  push:
    branches: [main]
  workflow_dispatch:
  schedule:
    # Run daily at 6:00 AM UTC (midnight CST / 1:00 AM CDT)
    - cron: '0 6 * * *'

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install

      - name: Build 11ty site
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '_site'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## Adding Content

To add a new article:
1. Create a new `.md` file in `src/articles/posts/`
2. Add the required frontmatter (title, excerpt, author, date, tags)
3. Write the article content in Markdown
4. Push to main - the build will include it if the date has passed

## Key Files Explained

| File | What It Does |
|------|--------------|
| `src/_includes/layouts/base.njk` | The HTML shell that wraps every page |
| `src/_data/articles.js` | Reads articles from local MD files at build time |
| `src/index.njk` | The landing page content |
| `src/articles/article.njk` | Template that generates each article page |
| `.eleventy.js` | 11ty configuration (input/output dirs, filters, collections) |

---

*Last updated: 2026-03-21*
