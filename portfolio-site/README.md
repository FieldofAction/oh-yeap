# Daniel Dickson — Creative Director & Systems Designer

Minimal portfolio site, visually consistent with Field of Action.

## Structure

- **index.html** - Homepage with hero grid and featured projects
- **pages/cases.html** - Case studies index
- **pages/writing.html** - Writing (redirects to Field of Action)
- **pages/about.html** - About page
- **css/style.css** - Shared styles

## Design System

Uses the same design system as Field of Action:
- **Colors**: Same color palette (dark theme)
- **Typography**: Hanken Grotesk + Space Mono
- **Spacing**: Consistent clamp() patterns
- **Layout**: Responsive grid system

## Serving Locally

### Option 1: Simple HTTP Server
```bash
cd portfolio-site
python3 -m http.server 8000
```
Visit: http://localhost:8000

### Option 2: Using npx
```bash
cd portfolio-site
npx serve
```

### Option 3: Live Server (VS Code extension)
Right-click index.html → "Open with Live Server"

## Deployment

This is a static site and can be deployed to:
- **Vercel**: `vercel deploy`
- **Netlify**: Drag and drop the folder
- **GitHub Pages**: Push to gh-pages branch
- **Any static host**: Upload the folder contents

## Customization

Replace placeholder images:
- Hero images in `index.html`
- Project images in case study pages
- All currently use placehold.co placeholders

## Relationship to Field of Action

- **This site**: Minimal portfolio, image-focused
- **Field of Action**: Comprehensive practice site with writing, tools, theory

Both sites share the same visual language but serve different purposes.
