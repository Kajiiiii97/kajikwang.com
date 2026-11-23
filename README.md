# kajikwang.com

Static portfolio site. No build step: every page is plain HTML.

## Put it online (GitHub Pages)

1. Create a public repo on GitHub, e.g. `kajikwang.com`.
2. Upload everything in this folder to the repo root (drag and drop on the repo page works).
3. Repo Settings > Pages > Source: "Deploy from a branch", branch `main`, folder `/ (root)`.
4. Custom domain: `www.kajikwang.com` (the `CNAME` file already says this).
5. At your domain registrar, replace the old Google Sites records with:
   - four A records for `@`: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
   - one CNAME record for `www` pointing to `<your-github-username>.github.io`
6. Once the domain check passes, tick "Enforce HTTPS".

## Editing

- Accent colour: `assets/style.css`, the two `--accent` lines at the top.
- Text: open the page's `index.html` and edit the words directly.
- Images: `assets/img/<project>/NN.webp` (project pages) and `assets/thumbs/<project>.webp` (home grid).
- Old Google Sites links (`/about-me`, `/contact`, `/projects/...`) keep working.
