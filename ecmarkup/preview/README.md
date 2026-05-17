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

System dependencies:

1. **`prince-books`**
   ([https://www.princexml.com/books/](https://www.princexml.com/books/)).
   On Ubuntu 24.04:

    ```bash
    curl -fsSL -o /tmp/prince-books.deb \
      https://princexml.com/download/prince-books_20240705-1_ubuntu24.04_amd64.deb
    sudo apt-get install -y /tmp/prince-books.deb
    ```

2. **Microsoft TrueType core fonts** (Arial, Verdana, Courier New) so the
   rendered PDF embeds the same glyphs as ECMA-424 instead of
   substituting open-source clones. Free for personal/non-commercial use
   under Microsoft's EULA.

    ```bash
    echo "ttf-mscorefonts-installer msttcorefonts/accepted-mscorefonts-eula select true" \
      | sudo debconf-set-selections
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ttf-mscorefonts-installer
    sudo fc-cache -fv
    ```

3. **IBM Plex** (open source, from IBM). Already pulled in by
   ecmarkup's CSS; on Ubuntu install with:

    ```bash
    sudo apt-get install -y fonts-ibm-plex
    sudo fc-cache -fv
    ```

Without (2) the PDF still renders cleanly, but Arial/Verdana/Courier New
fall back to Liberation Sans / DejaVu Sans / DejaVu Sans Mono respectively.
Without (3), IBM Plex Mono falls back to DejaVu Sans Mono.

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
