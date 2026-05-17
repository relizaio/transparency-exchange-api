# Producing the ECMA edition of TEA — process and open work

This document is for the working group. It describes how the
[`ecmarkup/`](./) experiment turns the current TEA repository into an
ECMA-style standard, and what's still missing before we can submit a
real edition.

## TL;DR

`spec/openapi.yaml` stays the source of truth for the API surface and
the data model. The various `*.md` files in the repository stay the
source of truth for the prose. A small Node build under `ecmarkup/`
assembles both into a single Ecmarkup HTML document and renders it
with the same toolchain ECMA TC54 already uses for ECMA-424
(CycloneDX). Nothing in the existing authoring workflow changes.

To see the current state of the experiment:

```bash
cd ecmarkup
npm install
npm run build               # HTML — out/index.html (single page)
npm run build-multipage     # HTML — out/multipage/*.html
npm run pdf                 # PDF  — out/TEA.pdf (requires prince-books)
npm run pdf:weasyprint      # PDF  — alternative, uses open-source weasyprint
```

The `pdf` script uses **Prince for Books** &mdash; the same PDF engine
ECMA TC54 already uses for ECMA-424 &mdash; under the non-commercial
license that ships with the unlicensed install. ECMA publication builds
inject a paid license via the
[`ghcr.io/ecma-tc54/princexml`](https://github.com/Ecma-TC54/ECMA-424/blob/main/.github/workflows/build.yml)
container in CI; for working-group internal review the non-commercial
license is sufficient. See `preview/README.md` for install instructions.

## How the document is assembled

`ecmarkup/build.js` glues five layers together, in this order:

1. **Header excerpt** (`excerpts/0x00-header.html`) &mdash; DOCTYPE,
   styles, the ECMA `<pre class="metadata">` block, the "About this
   specification" prefix.
2. **Introduction** &mdash; pulled directly from the `## Introduction`
   section of the repository `README.md`.
3. **Front matter** (`excerpts/0x2*.html`) &mdash; Scope, Conformance,
   Normative References, Terms & Definitions. *All four are skeletons
   right now and need working-group review (see "Work remaining" below).*
4. **Narrative** &mdash; imported verbatim from the Markdown files
   listed in `NARRATIVE_DOCS` in `build.js`. Each H1 in a Markdown file
   becomes a top-level clause; H2/H3 nest underneath.
5. **API surface** &mdash; generated from `spec/openapi.yaml`. Operations
   are grouped by OpenAPI `tag`. Each operation lists parameters,
   request body and responses in standard ECMA-style tables.
6. **Data model** &mdash; one clause per entry in
   `components.schemas`, with a properties table, enum table, format
   and pattern hints, and examples.
7. **Back matter** (`excerpts/1x*.html`) &mdash; Bibliography and
   Colophon. *Both skeletons.*

The build is purely additive: deleting `ecmarkup/` leaves the rest
of the repository unchanged.

## Editing source content

| If you want to change… | Edit this | And the spec will… |
|---|---|---|
| The API surface (paths, parameters, responses) | `spec/openapi.yaml` | regenerate sections 5 and 6 |
| A data type or enum | `spec/openapi.yaml` (`components.schemas`) | regenerate section 6 |
| The Discovery / Authn / Use-case / etc. prose | The relevant `.md` file (see `NARRATIVE_DOCS`) | re-import that chapter |
| The Introduction | The repo `README.md` (`## Introduction`) | re-import |
| Scope / Conformance / References / Bibliography / Colophon | The `excerpts/*.html` files | be re-included verbatim |
| The order or grouping of narrative chapters | `NARRATIVE_DOCS` in `ecmarkup/build.js` | reflow |

## Work remaining before an ECMA submission

These are the gaps the PoC explicitly does not close.

### Editorial

- **Scope (`excerpts/0x20-scope.html`)** &mdash; current text is a
  reasonable first draft but has not been reviewed.
- **Conformance (`excerpts/0x21-conformance.html`)** &mdash; needs to
  be tightened against actual implementation requirements once those
  stabilize.
- **Normative references (`excerpts/0x22-normative-references.html`)**
  &mdash; review the list, add anything missing (e.g. RFCs for HTTP
  status semantics if needed), drop anything that isn't truly
  normative.
- **Terms and definitions (`excerpts/0x23-terms-and-definitions.html`)**
  &mdash; the repo `README.md` already has a short "Terminology" list;
  the working group should decide which terms are normative and
  promote them here.
- **Bibliography (`excerpts/1x10-bibliography.html`)** and **Colophon
  (`excerpts/1x20-colophon.html`)** &mdash; both stubs.
- **`info.description` in `spec/openapi.yaml`** is currently `TBC`.
  This is what appears under the auto-generated "The TEA API" clause.
- **Several narrative Markdown files contain TODOs and inline notes
  to authors.** These will surface verbatim in the rendered spec
  until cleaned up.

### Markdown re-organisation

The working group has indicated that the Markdown layout will be
reorganised. The build accommodates this without any code change:
update the `NARRATIVE_DOCS` array in `ecmarkup/build.js` to point at
the new paths and the new chapter order. Each entry is
`[pathRelativeToRepoRoot, idPrefix]`. The `idPrefix` is used to
namespace generated clause IDs so multiple chapters can use the same
heading text without collision.

### Intra-document anchors in Markdown

GitHub-flavoured Markdown links such as
`[TEA Collection object (TCO)](#the-tea-collection-object-tco)` work
in GitHub's web view but don't resolve to anything in the Ecmarkup
rendering, because the generated clause IDs follow a different
convention (e.g. `sec-tea-collection-N-the-tea-collection-object-tco`).
At present this produces four ecmarkup warnings on the current
content, all in `tea-collection/tea-collection.md`:

- `#the-tea-collection-object-tco` &rarr; heading "TEA Collection object (TCO)" on line 274.
- `#the-reason-for-tco-update-enum` &rarr; heading "The reason for TCO update enum" on line 376.
- `#tea-artifact-object` &rarr; heading "TEA Artifact object" on line 327.
- `#tea-artefact-types` &rarr; heading "TEA Artifact types" on line 389.

Two ways to close this:

1. **Author-side**: change each `(#anchor)` link in Markdown to use
   the Ecmarkup-generated ID (visible by inspecting the rendered
   output, or knowable from the slug rules in `md-to-emu.js`).
2. **Build-side**: emit an additional `<span id="...">` companion
   anchor on each heading that matches the GitHub-Flavored-Markdown
   slugification rules. This is ~20 lines of code in
   `lib/md-to-emu.js` and can be added once the Markdown
   re-organisation has settled.

### Mermaid and other unknown code-fence languages

ecmarkup syntax-highlights fenced code blocks via highlight.js.
Languages it doesn't know about (`mermaid`, `abnf`, `bnf`, `webidl`,
`http`, `cmd`, `console`, `text`) would crash the build, so the
build silently drops the language tag for those. Mermaid diagrams
therefore appear as `<pre>` text, not rendered diagrams. A future
revision could swap in a build-time Mermaid-to-SVG step if the
working group wants the diagrams to render.

### Operations referenced from the narrative

A common ECMA-standard pattern is for the narrative to refer to
operations by name (e.g. `<emu-xref href="#sec-tea-op-getteaproductbyuuid"></emu-xref>`).
The generated operation IDs follow the deterministic pattern
`sec-tea-op-<lowercased-operationId>`, so narrative authors can
already link to them.

### CI

There is no GitHub Action wiring yet. The natural shape would be a
workflow that runs `npm run build` on every PR, fails on warnings
once the warning baseline reaches zero, and publishes the rendered
HTML and PDF as build artifacts.

## Conventions

- **Where to put new prose**: add a new `.md` file under a
  topic-appropriate directory and add an entry to `NARRATIVE_DOCS`
  in `ecmarkup/build.js`.
- **Where to put new API operations or schemas**: edit
  `spec/openapi.yaml`. The build picks them up automatically.
- **Where to put hand-crafted Ecmarkup content** (e.g. an algorithm
  in `<emu-alg>`): a new excerpt file under `excerpts/`, named with
  the appropriate `0x__` / `1x__` prefix to control placement.
