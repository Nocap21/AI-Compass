git push -u origin main# AI Compass

A modern, fully responsive directory for discovering, searching, comparing, and bookmarking AI tools — built with nothing but **HTML5, CSS3, vanilla JavaScript (ES6), and JSON**. No frameworks, no build step, no dependencies.

## Running it locally

Because the site fetches `data/tools.json` with `fetch()`, it needs to be served over HTTP (opening `index.html` directly with `file://` will block the request in most browsers). Any static server works:

```bash
cd AI-Compass
python3 -m http.server 8080
# then open http://localhost:8080
```

## Folder structure

```
AI-Compass/
├── index.html          Home page — hero, trending, categories, featured, popular searches, newsletter
├── tools.html           All Tools — live search, filters, sorting
├── details.html         Tool detail page (reads ?id=)
├── compare.html          Side-by-side comparison of two tools
├── bookmarks.html        Saved tools (Local Storage)
├── about.html            Project overview
├── contact.html           Contact form with client-side validation
├── 404.html               Not-found page
├── css/                   One stylesheet per page + a shared style.css and responsive.css
├── js/                    One module per concern (data, search, filter, bookmarks, compare, etc.)
├── data/tools.json        54 AI tools across 14 categories
└── assets/                Logos, screenshots, icons, images (placeholders)
```

## Features

- Live search with auto-suggestions (name, category, developer, tags)
- Filtering by category, developer, pricing, platform, skill level, and industry
- Sorting: A–Z, Z–A, rating, free/paid first, recently added
- Compare any two tools side by side, with a queue-from-anywhere Compare button
- Bookmarks stored in Local Storage, with a dedicated saved-tools page
- Recently viewed tools tracked automatically from the Details page
- Dark mode with saved preference
- Toast notifications, skeleton loading states, scroll-to-top, empty states, custom 404

## Data

`data/tools.json` holds every tool's id, developer, category, rating, pricing, platforms, features, pros/cons, tags, alternatives, and metadata used to drive search, filters, sorting, and the comparison table. Add a new tool by appending an object with the same shape — every page picks it up automatically.

## Tech

HTML5 · CSS3 (custom properties, Grid, Flexbox) · JavaScript (ES6, `fetch`, Local Storage) · JSON — no React, Vue, Angular, Bootstrap, Tailwind, or jQuery.
