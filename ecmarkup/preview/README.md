# Preview artifacts

These files are committed to the experimental branch so that reviewers can
see the rendered output without running the build. They are **not** intended
to live on `main` &mdash; the canonical artifact is produced by
`npm run build` / `npm run pdf` from `ecmarkup/`.

- `TEA.pdf` &mdash; PDF rendering produced via WeasyPrint
  (`out/index.html` &rarr; `out/TEA.pdf`).
- `TEA-single-page.html` &mdash; the single-page HTML rendering
  (Ecmarkup's printable build). Open in a browser.

## How they were produced

```bash
cd ecmarkup
npm install
npm run pdf       # generates out/TEA.pdf via weasyprint
```

System dependency: `weasyprint` (Debian/Ubuntu: `sudo apt-get install weasyprint`,
macOS: `brew install weasyprint`, Python: `pip install weasyprint`).

## Alternative renderers

The ECMA-424 build uses [`prince-books`](https://www.princexml.com/prince-for-books/)
(commercial, free for non-commercial use) and the same approach would work
here &mdash; see `package.json::scripts.build-for-pdf` for the
`ecmarkup --printable` flag that produces the print-styled HTML.
