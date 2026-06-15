# nocoderequired.dev

Landing page for **No Code Required: The Non-Technical Manager's Guide to Engineering Teams** by Scott Darden.

Plain HTML/CSS — no build step.

## Structure

```
index.html      Single-page landing site
styles.css      All styles (black / white / red wordmark theme)
assets/
  cover.png     Book cover
  wordmark.png  "NO CODE REQUIRED" title art
  author.png    Author portrait
```

## Local preview

Open `index.html` directly in a browser, or serve it:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy

Any static host works (Netlify, Cloudflare Pages, GitHub Pages, Vercel). Point
the host at this folder; there is no build command.

## To do

- Fill in the **buy links** (Amazon / Apple Books) in `index.html` (`#buy` section).