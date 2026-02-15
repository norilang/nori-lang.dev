/**
 * generate-error-docs.mjs
 *
 * Reads ../data/errors.json and generates one Starlight-compatible .md file
 * per error/warning entry into ../src/content/docs/errors/generated/.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.resolve(__dirname, "../data/errors.json");
const outputDir = path.resolve(
  __dirname,
  "../src/content/docs/errors/generated"
);

// ---------------------------------------------------------------------------
// Read input
// ---------------------------------------------------------------------------

if (!fs.existsSync(inputPath)) {
  console.error(`Error: ${inputPath} not found.`);
  process.exit(1);
}

const errors = JSON.parse(fs.readFileSync(inputPath, "utf-8"));

if (!Array.isArray(errors)) {
  console.error("Error: errors.json must contain a JSON array.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Prepare output directory (clear & recreate)
// ---------------------------------------------------------------------------

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute the sidebar order from an error/warning code.
 *   E0001 -> 1,  E0010 -> 10
 *   W0001 -> 10001, W0010 -> 10010   (warnings sort after errors)
 */
function sidebarOrder(code) {
  const prefix = code.charAt(0).toUpperCase();
  const num = parseInt(code.slice(1), 10);
  return prefix === "W" ? num + 10000 : num;
}

/**
 * Convert a see_also entry (e.g. "language/types") into a markdown link.
 * The display text is the last path segment, title-cased.
 */
function seeAlsoLink(relPath) {
  const label = relPath
    .split("/")
    .pop()
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return `- [${label}](/${relPath}/)`;
}

// ---------------------------------------------------------------------------
// Generate files
// ---------------------------------------------------------------------------

let generated = 0;

for (const entry of errors) {
  const {
    code,
    title,
    category,
    explanation,
    suggestion,
    bad_example,
    good_example,
    see_also,
  } = entry;

  const isWarning = code.charAt(0).toUpperCase() === "W";
  const order = sidebarOrder(code);
  const upperCode = code.toUpperCase();
  const lowerCode = code.toLowerCase();
  const fileName = `${lowerCode}.md`;

  // Build sections --------------------------------------------------------

  const lines = [];

  // Frontmatter
  lines.push("---");
  lines.push(`title: "${upperCode}: ${title}"`);
  lines.push(
    `description: "Nori compiler ${isWarning ? "warning" : "error"} ${upperCode} explanation and fix"`
  );
  lines.push("sidebar:");
  lines.push(`  label: "${upperCode}"`);
  lines.push(`  order: ${order}`);
  lines.push("---");
  lines.push("");

  // Warning notice
  if (isWarning) {
    lines.push(
      ':::note\nThis is a **warning**, not an error. Your code will still compile.\n:::'
    );
    lines.push("");
  }

  // Explanation
  lines.push("## What went wrong");
  lines.push("");
  lines.push(explanation);
  lines.push("");

  // Suggestion
  lines.push("## How to fix it");
  lines.push("");
  lines.push(suggestion);
  lines.push("");

  // Examples
  if (bad_example || good_example) {
    lines.push("## Example");
    lines.push("");

    if (bad_example) {
      lines.push("**This code will produce the error:**");
      lines.push("");
      lines.push("```rust");
      lines.push(bad_example);
      lines.push("```");
      lines.push("");
    }

    if (good_example) {
      lines.push("**Corrected code:**");
      lines.push("");
      lines.push("```rust");
      lines.push(good_example);
      lines.push("```");
      lines.push("");
    }
  }

  // See also
  if (see_also && see_also.length > 0) {
    lines.push("## See also");
    lines.push("");
    for (const ref of see_also) {
      lines.push(seeAlsoLink(ref));
    }
    lines.push("");
  }

  // Write file ------------------------------------------------------------

  const outPath = path.join(outputDir, fileName);
  fs.writeFileSync(outPath, lines.join("\n"), "utf-8");
  generated++;
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

const errorCount = errors.filter(
  (e) => e.code.charAt(0).toUpperCase() === "E"
).length;
const warningCount = errors.filter(
  (e) => e.code.charAt(0).toUpperCase() === "W"
).length;

console.log(
  `Generated ${generated} file(s) (${errorCount} error(s), ${warningCount} warning(s)) in ${outputDir}`
);
