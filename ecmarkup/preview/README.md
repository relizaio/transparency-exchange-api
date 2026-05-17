# Preview artifacts

These files are committed to the experimental branch so that reviewers can
see the rendered output without running the build. They are **not** intended
to live on `main` &mdash; the canonical artifact is produced by
`npm run build` / `npm run pdf` from `ecmarkup/`.

- `TEA.pdf` &mdash; PDF rendering produced by **Prince for Books**
  (the same engine ECMA-424 uses). Run under the non-commercial
  license that ships with the unlicensed install.
- `TEA-single-page.html` &mdash; the single-page HTML rendering
  (Ecmarkup's printable build). Open in a browser.

## How they were produced

```bash
cd ecmarkup
npm install
npm run pdf       # generates out/TEA.pdf via prince-books
```

System dependency: `prince-books`
([https://www.princexml.com/books/](https://www.princexml.com/books/)).
On Ubuntu 24.04:

```bash
curl -fsSL -o /tmp/prince-books.deb \
  https://princexml.com/download/prince-books_20240705-1_ubuntu24.04_amd64.deb
sudo apt-get install -y /tmp/prince-books.deb
```

Note: this build runs under Prince for Books' built-in non-commercial
license. Commercial / production publication runs (e.g. ECMA's own
release builds for ECMA-424) use a paid license; without one,
commercial output is watermarked. For working-group internal review
and CI artefact builds the non-commercial license is sufficient.

## Alternative renderer

`npm run pdf:weasyprint` produces the same logical output using
[WeasyPrint](https://weasyprint.org/) (Apache-2.0, fully open source).
Visual fidelity is close but not exact; Prince's pagination is what
ECMA-424 ships.
