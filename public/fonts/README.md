# Fonts — GT America (licensed, NOT in git)

GT America is licensed under the **Grilli Type EULA** and this repository is
**public**, so the font files must never be committed. They're gitignored
(`.gitignore` → `/public/fonts/*.woff2` etc.).

## Files this app expects

Place these four `.woff2` files in this directory for local dev and deploys:

- `GT-America-Standard-Regular.woff2`
- `GT-America-Standard-Medium.woff2`
- `GT-America-Extended-Regular.woff2`
- `GT-America-Extended-Medium.woff2`

They're wired via `@font-face` in `src/app/globals.css` (NOT `next/font/local`,
on purpose — see the comment there):
- **Standard** → font family `"GT America"` (body default, the `font-sans` utility)
- **Extended** → font family `"GT America Extended"` (titles, the `font-extended` utility)

Source: the licensed GT America purchase (`GT Font File …_files.zip`).

## Deploying with the real fonts

Because the files aren't in the repo, **git-triggered Netlify builds fall back
to system sans** — a missing `/fonts/*.woff2` just 404s and `@font-face`
degrades to the next family in the stack. To ship the real fonts, deploy
manually from a machine that has them in `public/fonts/`:

```bash
netlify deploy --prod
```

This runs the build locally with the fonts present, then uploads the result.
The site renders GT America; the public repo never contains the binaries.

## If the fonts are missing

`@font-face` degrades gracefully — a build without the files succeeds and the
browser falls back to system sans rather than crashing (unlike `next/font/local`,
which hard-fails the build on a missing file). So auto-deploys stay green; they
just won't have the licensed font until the next manual `netlify deploy --prod`.
