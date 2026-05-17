import fs from "node:fs";
import path from "node:path";
import beautify from "js-beautify";
import MarkdownIt from "markdown-it";
import { markdownToEmuClauses } from "./lib/md-to-emu.js";
import { openApiToEmu } from "./lib/openapi-to-emu.js";

const ROOT = path.resolve(import.meta.dirname, "..");
const HERE = import.meta.dirname;
const OUT = path.join(HERE, "spec.html");

const NARRATIVE_DOCS = [
  ["doc/tea-requirements.md", "req"],
  ["doc/tea-usecases.md", "uc"],
  ["discovery/readme.md", "discovery"],
  ["auth/readme.md", "auth"],
  ["api-flow/consumer.md", "flow-consumer"],
  ["api-flow/publisher.md", "flow-publisher"],
  ["tea-product/tea-product.md", "tea-product"],
  ["tea-product/tea-product-release.md", "tea-product-release"],
  ["tea-component/tea-component.md", "tea-component"],
  ["tea-component/tea-release.md", "tea-release"],
  ["tea-collection/tea-collection.md", "tea-collection"],
  ["tea-artifact/tea-artifact.md", "tea-artifact"],
  ["signatures/signature.md", "signatures"],
];

function readExcerpt(name) {
  return fs.readFileSync(path.join(HERE, "excerpts", name), "utf-8");
}

async function build() {
  let html = "";

  html += readExcerpt("0x00-header.html") + "\n";

  const readme = fs.readFileSync(path.join(ROOT, "README.md"), "utf-8");
  const introMatch = /## Introduction\n([\s\S]*?)(?=\n## )/.exec(readme);
  const introMd = introMatch ? introMatch[1].trim() : "";
  html += `<emu-intro id="sec-intro">\n<h1>Introduction</h1>\n`;
  if (introMd) {
    const mdi = new MarkdownIt({ html: true, linkify: true });
    html += mdi.render(introMd) + "\n";
  } else {
    html += "<p>The Transparency Exchange API (TEA) standardizes the exchange of supply-chain transparency artefacts.</p>\n";
  }
  html += "</emu-intro>\n";

  // Front matter (skeletons authored as excerpts)
  html += readExcerpt("0x20-scope.html") + "\n";
  html += readExcerpt("0x21-conformance.html") + "\n";
  html += readExcerpt("0x22-normative-references.html") + "\n";
  html += readExcerpt("0x23-terms-and-definitions.html") + "\n";

  // Narrative leads the body of the spec.
  html += `<emu-clause id="sec-tea-narrative">\n<h1>Specification narrative</h1>\n`;
  html += "<p>The following sections are derived from the working group's authoring notes maintained as Markdown in the source repository.</p>\n";
  for (const [rel, idPrefix] of NARRATIVE_DOCS) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) {
      console.warn(`skipping missing: ${rel}`);
      continue;
    }
    html += `<!-- imported from ${rel} -->\n`;
    html += markdownToEmuClauses(fs.readFileSync(full, "utf-8"), idPrefix);
  }
  html += "</emu-clause>\n";

  // Generated API surface + data model follow the narrative.
  html += await openApiToEmu(path.join(ROOT, "spec/openapi.yaml"));

  // Back matter
  html += readExcerpt("1x10-bibliography.html") + "\n";
  html += readExcerpt("1x20-colophon.html") + "\n";

  const TAGS_TO_SKIP = ["pre", "code", "script"];
  const placeholders = {};
  let counter = 0;
  let working = html;
  for (const tag of TAGS_TO_SKIP) {
    const re = new RegExp(`<${tag}[^>]*?>[\\s\\S]*?<\\/${tag}>`, "gi");
    working = working.replace(re, m => {
      const k = `__PH_${tag.toUpperCase()}_${counter++}__`;
      placeholders[k] = m;
      return k;
    });
  }
  let pretty = beautify.html(working, {
    indent_size: 2,
    preserve_newlines: false,
    max_preserve_newlines: 1,
    wrap_line_length: 0,
    end_with_newline: true,
  });
  for (const [k, v] of Object.entries(placeholders)) pretty = pretty.replace(k, v);

  fs.writeFileSync(OUT, pretty);
  console.log(`wrote ${OUT} (${pretty.length} bytes)`);
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});
