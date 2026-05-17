# Ecmarkup proof-of-concept for the Transparency Exchange API

This directory is an **experiment**, not the canonical TEA build. It explores
whether the existing TEA source material — `spec/openapi.yaml` and the various
Markdown files spread across the repository — can be assembled into an
[Ecmarkup](https://github.com/tc39/ecmarkup) document of the kind ECMA TC54
already uses for ECMA-424 (CycloneDX).

## What it produces

`npm install && npm run build` produces:

- `spec.html` — a single Ecmarkup source document, generated from the live
  `openapi.yaml` and Markdown files in this repo.
- `out/index.html` — the rendered single-page spec.
- `out/multipage/` — the rendered multi-page spec.

`npm run pdf` additionally produces `out/TEA.pdf` (requires `weasyprint`).
Pre-rendered review copies of both the HTML and PDF are committed under
[`preview/`](./preview) on this experimental branch.

See [`PROCESS.md`](./PROCESS.md) for working-group-facing notes:
what's drafted vs. what still needs authoring, how to reorganise the
Markdown layout, anchor reconciliation, and the editorial gaps that have
to close before this can be submitted as an ECMA edition.

Running on the current `main`, the rendered output groups content as:

```
1   Scope                      (excerpts/0x20-scope.html, skeleton)
2   Conformance                (excerpts/0x21-conformance.html, skeleton)
3   Normative references       (excerpts/0x22-normative-references.html, skeleton)
4   Terms and definitions      (excerpts/0x23-terms-and-definitions.html, skeleton)
5   Specification narrative    (imported from Markdown — narrative leads)
    5.1 TEA Requirements        (doc/tea-requirements.md)
    5.2 TEA Use Cases           (doc/tea-usecases.md)
    5.3 Discovery               (discovery/readme.md)
    5.4 Authentication          (auth/readme.md)
    5.5 Consumer API flow       (api-flow/consumer.md)
    5.6 Publisher API flow      (api-flow/publisher.md)
    5.7 TEA Product             (tea-product/...)
    ...
6   The TEA API                (generated from spec/openapi.yaml — paths by tag)
    6.1 CLE
    6.2 TEA Artifact
    6.3 TEA Component
    ...
7   Data model                 (generated from components.schemas)
    7.1 artifact
    7.2 artifact-format
    ...
A   Bibliography               (excerpts/1x10-bibliography.html, skeleton)
B   Colophon                   (excerpts/1x20-colophon.html, skeleton)
```

## How it works

There are three sources stitched together by `build.js`:

1. **Hand-written excerpts** in `excerpts/` for boilerplate that Ecmarkup
   requires (DOCTYPE, `<pre class="metadata">`, the "about" block). This
   mirrors the pattern ECMA-424 uses with files named `0xNN-*.html`.

2. **OpenAPI → Ecmarkup** (`lib/openapi-to-emu.js`). Parses
   `spec/openapi.yaml` with `@apidevtools/json-schema-ref-parser`, then
   emits:
   - one `<emu-clause>` per OpenAPI **tag**, with nested clauses for each
     operation (path + method) describing parameters, request bodies, and
     responses;
   - a flat **Data model** section with one `<emu-clause>` per
     `components.schemas.*` entry (properties table, enums, format/pattern,
     examples).

3. **Markdown → Ecmarkup** (`lib/md-to-emu.js`). Walks each Markdown
   document, maps headings `#` … `######` to nested `<emu-clause>` boundaries,
   and renders the prose between headings with `markdown-it`. It strips the
   table-of-contents bullet list that several TEA docs include immediately
   after their H1 (Ecmarkup builds its own TOC). Fenced code blocks whose
   language is not recognized by `highlight.js` (e.g. `mermaid`, `abnf`,
   `webidl`, `http`) have their language hint dropped so the build doesn't
   crash on the bundled syntax highlighter.

## What works

- The full ECMA-424 toolchain runs unmodified: `ecmarkup`, `--multipage`,
  table-of-contents generation, section numbering (`1`, `1.1.1`, …),
  search box, dark-mode CSS, copyright boilerplate.
- All ~30 OpenAPI operations and ~50 component schemas render into
  cross-referenced sections with stable section IDs derived from
  `operationId` and schema name.
- All current narrative Markdown files import cleanly (the build is
  green on `main`).
- Anchors in `<a href="#...">` links inside Markdown survive the import;
  Ecmarkup will warn about ones it can't resolve and the warnings tell
  you exactly which authoring anchors don't map to a section ID — see
  "Open questions" below.

## What's hand-wavy or missing

The PoC deliberately stops at "does this approach hang together". A real
publication build would also need:

- **Front matter**: scope, normative references, terms & definitions,
  conformance — ECMA-424 ships these as `0x20-Scope-Conformance-References.html`
  and `0x30-Overview.html`. For TEA they don't exist as content yet and
  would have to be authored.
- **Back matter**: bibliography, colophon, copyright. ECMA-424 has
  `1x10-Grammar.html`, `1x20-Bibliography.html`, `1x30-Colophon.html`.
- **Editorial polish**: ECMA-424 uses an `EnglishTranslation` pass to
  normalize phrasing (e.g. JSON-schema-isms → "shall" / "should") and a
  `Reference` lookup to turn `$ref`s into cross-doc references. That
  layer is not yet ported.
- **Anchor reconciliation**: Markdown files contain intra-doc anchors
  like `#the-tea-collection-object-tco` written by humans. The auto-
  generated clause IDs are different (e.g. `sec-tea-collection-…-the-tea-collection-object`).
  ecmarkup warns about every unresolved anchor; the long-term fix is
  either (a) authoring discipline so the Markdown ids match what
  ecmarkup will generate, or (b) a small anchor-rewriting pass in
  `md-to-emu.js`.
- **OpenAPI prose**: `info.description` is currently `TBC`. The PoC
  surfaces this verbatim — it would be replaced by real text in a
  publication build.
- **Validation / linting**: not running `ecmarkup --lint-spec --strict`
  yet; many lint findings in this PoC are imported-Markdown stylistic
  issues, not specification defects.

## How to run it

```bash
cd ecmarkup
npm install
npm run build              # one-shot: regenerate spec.html and render single-page
npm run build-multipage    # multipage rendering (after generate-spec)
```

`generate-spec` reads from the repository as-is (no copies, no checked-in
intermediate files), so changing any source `.md` or `spec/openapi.yaml`
and re-running is enough.

## Why this might be the right shape

- **Single source of truth per content type stays put.** API surface
  lives in `spec/openapi.yaml`; prose lives in `.md` files; this PoC is
  *purely additive* — nothing about the upstream authoring workflow
  changes.
- **The same toolchain as ECMA-424 means TC54 reviewers see familiar
  output.** Section numbering, TOC, multipage layout, copyright block
  all match.
- **The conversion code is small** — ~150 lines for Markdown, ~200 for
  OpenAPI — and easy to evolve as the spec matures.

## Decisions that are deferred to the working group

1. Should the OpenAPI section drive the narrative (current PoC layout),
   or should narrative chapters reference operations by name from a flat
   "Operations" appendix? ECMA-424 has only data, no operations, so
   there's no precedent here.
2. How should `oneOf` / `anyOf` / `allOf` in component schemas render?
   The PoC currently surfaces the type as `oneOf` / `anyOf` but does
   not recurse into the variants. ECMA-424's `EcmarkupGenerator`
   handles this and could be ported.
3. Should Markdown files migrate to Ecmarkup-native HTML over time, or
   stay as Markdown forever and be re-imported on every build? The
   PoC supports the latter, but the working group may prefer the
   former for editorial control.
