# Demo Sites

This folder contains standalone demo sites for prospective clients.

## URL Structure

Each demo is accessible at:
```
sitesoncall.com/demos/[client-slug]/
```

## Creating a New Demo

1. Copy `_template/` to a new folder named with the client slug (lowercase, hyphens)
2. Update the HTML with client info:
   - Business name, tagline, phone, email, address
   - Logo and favicon URLs from Cloudinary
   - Hero image and any other photos
   - Services list
   - Colors (CSS variables at top of file)
3. Push to GitHub
4. Share link: `sitesoncall.com/demos/[client-slug]/`

## Current Demos

- `green-matters/` — Green Matters Lawn & Landscape (Hartselle, AL)

## Notes

- Demos are standalone HTML — no 11ty processing
- All images should be hosted on Cloudinary
- Forms are placeholder only (no backend)
- These are sales tools, not production sites
