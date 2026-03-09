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
│   │   └── articles.js           # Fetches articles from UP Blog API at build
│   ├── articles/
│   │   ├── index.njk             # Article listing page (/articles/)
│   │   └── article.njk           # Individual article template
│   ├── css/
│   │   └── styles.css            # All site styles
│   ├── js/
│   │   └── main.js               # Interactive JS (nav, modal, forms)
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

**⚠️ SETUP REQUIRED:** The GitHub Actions workflow file needs to be added manually. See `.github/workflows/build.yml` section below.

## Articles / Blog

Articles are fetched from the UP Blog API at build time.

**⚠️ SETUP REQUIRED (Micaiah):**
- Create a UP Blog entry for `sites-on-call` in the database
- The data file expects the API at: `https://blog.untitledpublishers.com/api/blogs/sites-on-call/posts`

Until the UP Blog is configured, the articles page will show "Coming Soon".

## GitHub Actions Workflow

The workflow file couldn't be pushed via API. Micaiah needs to create this file manually:

**File:** `.github/workflows/build.yml`

```yaml
name: Build and Deploy 11ty Site

on:
  push:
    branches: [main]
  workflow_dispatch:

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
1. Create/publish the article in UP Blog under the `sites-on-call` blog
2. The next build will automatically fetch and generate the article page

## Key Files Explained

| File | What It Does |
|------|--------------|
| `src/_includes/layouts/base.njk` | The HTML shell that wraps every page |
| `src/_data/articles.js` | Fetches articles from API at build time |
| `src/index.njk` | The landing page content |
| `src/articles/article.njk` | Template that generates each article page |
| `.eleventy.js` | 11ty configuration (input/output dirs, filters) |

---

*Last build triggered: 2026-03-09*
