# Digital Exhibition Portfolio (Vanilla HTML/CSS/JS)

This is a **museum-grade digital art portfolio** built as a quiet, editorial “printed catalogue turned digital”.

It works **without CMS**. It also includes an **optional Decap (Netlify) CMS** setup you can enable later.

---

## 1) What’s inside

- `index.html` — Home (manifesto + featured works + about)
- `works.html` — Catalogue with filter + sort
- `work.html` — Work detail page (loads via query string like `work.html?id=w003`)
- `commission.html` — Commission info (accordion)
- `contact.html` — Netlify Forms inquiry form (with refined success message)
- `terms.html` — Professional terms

Content is stored locally:

- `content/site.json`
- `content/artworks.json`

Images are stored locally:

- `assets/uploads/`

---

## 2) Run it locally (on your computer)

### Option A (easiest): use VS Code “Live Server”
1. Install **VS Code**
2. Install the extension **Live Server**
3. Right-click `index.html` → **Open with Live Server**

### Option B: use a simple local server
If you have Python installed:

```bash
cd digital-exhibition
python -m http.server 8000
```

Then open your browser and go to:

`http://localhost:8000`

> (We use a local server because the site loads JSON with `fetch()` — opening the HTML file directly may block it.)

---

## 3) Deploy to Netlify (like you’re a child)

1. Go to Netlify and log in
2. Click **Add new site** → **Deploy manually**
3. Drag-and-drop the entire **folder** called `digital-exhibition` into Netlify
4. Wait for it to finish
5. Click the new site URL Netlify gives you

✅ Done. The site is live.

### Netlify Forms (Contact page)
After deployment:
1. Open your Netlify dashboard
2. Go to your site → **Forms**
3. You’ll see submissions appear there when someone uses the contact form

---

## 4) Optional: enable the CMS later (Decap / Netlify CMS)

The CMS is already prepared in:

- `/admin/index.html`
- `/admin/config.yml`

To enable it on Netlify:

1. In Netlify, open your site settings
2. Enable **Identity**
3. Enable **Git Gateway**
4. Deploy the site from a Git repo (recommended), because CMS writes changes back to Git
5. Visit:
   `/admin/`

Example:
`https://your-site.netlify.app/admin/`

Now you can edit:
- `content/site.json`
- `content/artworks.json`

---

## 5) Where to edit artworks

Open:

- `content/artworks.json`

Each artwork has:
- `id`, `title`, `year`, `category`, `tools`, `status`, `price/sold_for`, `description`, `images`

To change images:
1. Put new images into `assets/uploads/`
2. Update the image paths inside the JSON (example: `"assets/uploads/my-new-image.jpg"`)

---

## 6) Notes

- No external image hotlinks (everything is local)
- Vanilla HTML/CSS/JS only
- Slow, restrained motion + page-turn veil feel

Last updated: January 24, 2026.
