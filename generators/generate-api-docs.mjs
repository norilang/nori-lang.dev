/**
 * generate-api-docs.mjs
 *
 * Reads ../data/catalog.json and ./api-descriptions.json, then generates
 * Starlight-compatible Markdown pages for the Nori API reference into
 * ../src/content/docs/api/generated/.
 *
 * Tier 1 pages: types in api-descriptions.json OR with >= 5 members.
 * Tier 2 pages: remaining types grouped by namespace.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Input / output paths
// ---------------------------------------------------------------------------

const catalogPath = path.resolve(__dirname, "../data/catalog.json");
const descriptionsPath = path.resolve(__dirname, "./api-descriptions.json");
const outputDir = path.resolve(
  __dirname,
  "../src/content/docs/api/generated"
);

// ---------------------------------------------------------------------------
// Udon-to-Nori type mapping (mirrors TypeSystem.cs)
// ---------------------------------------------------------------------------

const UDON_TO_NORI = {
  SystemBoolean: "bool",
  SystemInt32: "int",
  SystemUInt32: "uint",
  SystemSingle: "float",
  SystemDouble: "double",
  SystemString: "string",
  SystemChar: "char",
  SystemObject: "object",
  SystemVoid: "void",
  UnityEngineVector2: "Vector2",
  UnityEngineVector3: "Vector3",
  UnityEngineVector4: "Vector4",
  UnityEngineQuaternion: "Quaternion",
  UnityEngineColor: "Color",
  UnityEngineColor32: "Color32",
  UnityEngineTransform: "Transform",
  UnityEngineGameObject: "GameObject",
  UnityEngineRigidbody: "Rigidbody",
  UnityEngineCollider: "Collider",
  UnityEngineMeshRenderer: "MeshRenderer",
  UnityEngineAudioSource: "AudioSource",
  UnityEngineAnimator: "Animator",
  VRCSDKBaseVRCPlayerApi: "Player",
  UnityEngineCollision: "Collision",
  VRCSDKBaseVRCSerializationResult: "SerializationResult",
  VRCUdonUdonBehaviour: "UdonBehaviour",
};

function udonToNori(udonType) {
  if (!udonType) return udonType;
  if (udonType.endsWith("Array")) {
    const elem = udonType.slice(0, -5);
    const nori = udonToNori(elem);
    return nori ? nori + "[]" : udonType;
  }
  return UDON_TO_NORI[udonType] || udonType;
}

// ---------------------------------------------------------------------------
// Read input files
// ---------------------------------------------------------------------------

if (!fs.existsSync(catalogPath)) {
  console.error(`Error: ${catalogPath} not found.`);
  process.exit(1);
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf-8"));

let descriptions = {};
if (fs.existsSync(descriptionsPath)) {
  descriptions = JSON.parse(fs.readFileSync(descriptionsPath, "utf-8"));
} else {
  console.warn(
    `Warning: ${descriptionsPath} not found. Generating without hand-written descriptions.`
  );
}

// ---------------------------------------------------------------------------
// Build type lookup (udonType -> type info from catalog.types[])
// ---------------------------------------------------------------------------

const typeInfoMap = new Map();
for (const t of catalog.types || []) {
  typeInfoMap.set(t.udonType, t);
}

// ---------------------------------------------------------------------------
// Build descriptions lookup (udonOwner -> description entry)
// ---------------------------------------------------------------------------

const descByOwner = new Map();
for (const [displayName, entry] of Object.entries(descriptions)) {
  descByOwner.set(entry.udonOwner, { displayName, ...entry });
}

// ---------------------------------------------------------------------------
// Group externs by owner type
// ---------------------------------------------------------------------------

const externsByOwner = new Map();
for (const ext of catalog.externs) {
  if (!externsByOwner.has(ext.owner)) {
    externsByOwner.set(ext.owner, []);
  }
  externsByOwner.get(ext.owner).push(ext);
}

// ---------------------------------------------------------------------------
// Process each owner type into a structured object
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} PropertyEntry
 * @property {string} name
 * @property {string} type        - Nori type name
 * @property {boolean} hasGet
 * @property {boolean} hasSet
 */

/**
 * @typedef {Object} MethodSignature
 * @property {string[]} paramNames
 * @property {string[]} paramTypes  - Nori type names
 * @property {string} returnType    - Nori type name
 * @property {boolean} isStatic
 */

/**
 * @typedef {Object} MethodEntry
 * @property {string} name
 * @property {MethodSignature[]} overloads
 */

/**
 * @typedef {Object} ProcessedType
 * @property {string} owner         - Udon owner name
 * @property {string} noriName      - Nori display name
 * @property {string} namespace     - dotNet namespace
 * @property {PropertyEntry[]} properties
 * @property {MethodEntry[]} methods
 * @property {number} memberCount   - properties + unique method names
 */

function processOwner(owner, externs) {
  const noriName = udonToNori(owner) || owner;

  // Look up namespace from types[]
  const typeInfo = typeInfoMap.get(owner);
  let namespace = "";
  if (typeInfo && typeInfo.dotNetType) {
    const parts = typeInfo.dotNetType.split(".");
    if (parts.length > 1) {
      namespace = parts.slice(0, -1).join(".");
    }
  }

  // Separate into properties, methods, constructors, operators
  const propMap = new Map(); // propName -> { type, hasGet, hasSet }
  const methodMap = new Map(); // methodName -> MethodSignature[]

  for (const ext of externs) {
    const kind = ext.kind;
    const methodName = ext.method;

    if (kind === "getter") {
      // Property getter
      if (!propMap.has(methodName)) {
        propMap.set(methodName, { name: methodName, type: null, hasGet: false, hasSet: false });
      }
      const prop = propMap.get(methodName);
      prop.hasGet = true;
      prop.type = udonToNori(ext.returnType);
    } else if (kind === "setter") {
      // Property setter
      if (!propMap.has(methodName)) {
        propMap.set(methodName, { name: methodName, type: null, hasGet: false, hasSet: false });
      }
      const prop = propMap.get(methodName);
      prop.hasSet = true;
      // For setters, the type is the first param (for instance setters)
      // or the only param for static setters
      if (!prop.type) {
        const paramTypes = ext.instance ? ext.paramTypes : ext.paramTypes;
        if (paramTypes.length > 0) {
          prop.type = udonToNori(paramTypes[paramTypes.length - 1]);
        }
      }
    } else if (kind === "constructor") {
      // Include constructors as static methods named "new"
      if (!methodMap.has("new")) {
        methodMap.set("new", []);
      }
      methodMap.get("new").push({
        paramNames: ext.paramNames || [],
        paramTypes: (ext.paramTypes || []).map(udonToNori),
        returnType: udonToNori(ext.returnType),
        isStatic: true,
      });
    } else if (kind === "operator") {
      // Skip operators - they are used via language syntax, not direct calls
    } else {
      // Regular method or static_method
      // Also detect property accessors by method name prefix (get_ / set_)
      // in case the kind field doesn't distinguish them
      if (methodName.startsWith("get_") && ext.paramTypes.length === 0 && kind === "method") {
        const propName = methodName.slice(4);
        if (!propMap.has(propName)) {
          propMap.set(propName, { name: propName, type: null, hasGet: false, hasSet: false });
        }
        const prop = propMap.get(propName);
        prop.hasGet = true;
        prop.type = udonToNori(ext.returnType);
      } else if (methodName.startsWith("set_") && kind === "method") {
        const propName = methodName.slice(4);
        if (!propMap.has(propName)) {
          propMap.set(propName, { name: propName, type: null, hasGet: false, hasSet: false });
        }
        const prop = propMap.get(propName);
        prop.hasSet = true;
        if (!prop.type && ext.paramTypes.length > 0) {
          prop.type = udonToNori(ext.paramTypes[ext.paramTypes.length - 1]);
        }
      } else {
        if (!methodMap.has(methodName)) {
          methodMap.set(methodName, []);
        }
        methodMap.get(methodName).push({
          paramNames: ext.paramNames || [],
          paramTypes: (ext.paramTypes || []).map(udonToNori),
          returnType: udonToNori(ext.returnType),
          isStatic: kind === "static_method",
        });
      }
    }
  }

  // Convert maps to sorted arrays
  const properties = [...propMap.values()].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const methods = [...methodMap.entries()]
    .map(([name, overloads]) => ({ name, overloads }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const memberCount = properties.length + methods.length;

  return { owner, noriName, namespace, properties, methods, memberCount };
}

const processedTypes = new Map();
for (const [owner, externs] of externsByOwner) {
  processedTypes.set(owner, processOwner(owner, externs));
}

// ---------------------------------------------------------------------------
// Determine tier 1 vs tier 2
// ---------------------------------------------------------------------------

const TIER1_MEMBER_THRESHOLD = 5;

const tier1 = [];
const tier2 = [];

for (const [owner, processed] of processedTypes) {
  const hasDescription = descByOwner.has(owner);
  const hasManyMembers = processed.memberCount >= TIER1_MEMBER_THRESHOLD;

  if (hasDescription || hasManyMembers) {
    tier1.push(processed);
  } else {
    tier2.push(processed);
  }
}

// Sort tier 1 alphabetically by Nori name
tier1.sort((a, b) => a.noriName.localeCompare(b.noriName));

// ---------------------------------------------------------------------------
// Helpers for Markdown generation
// ---------------------------------------------------------------------------

/**
 * Convert a Nori type name to a kebab-case filename (without extension).
 * e.g. "Transform" -> "transform", "Vector3" -> "vector3",
 *      "Transform[]" -> "transform-array", "Player" -> "player"
 */
function toKebabCase(name) {
  // Handle array suffix before general kebab-case conversion
  let result = name;
  if (result.endsWith("[]")) {
    result = result.slice(0, -2) + "Array";
  }
  return result
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Format a method signature line.
 * e.g. "Rotate(axis: Vector3, angle: float) -> void"
 */
function formatSignature(name, sig) {
  const prefix = sig.isStatic ? "static " : "";
  const params = sig.paramNames
    .map((pName, i) => `${pName}: ${sig.paramTypes[i] || "?"}`)
    .join(", ");
  return `${prefix}${name}(${params}) -> ${sig.returnType}`;
}

/**
 * Escape pipe characters in Markdown table cells.
 */
function escapeCell(text) {
  return text.replace(/\|/g, "\\|");
}

// ---------------------------------------------------------------------------
// Clear and recreate output directory
// ---------------------------------------------------------------------------

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

// ---------------------------------------------------------------------------
// Generate Tier 1 pages
// ---------------------------------------------------------------------------

let tier1Count = 0;

for (const processed of tier1) {
  const desc = descByOwner.get(processed.owner);
  const noriName = desc ? desc.displayName : processed.noriName;
  const fileName = toKebabCase(noriName) + ".md";

  const lines = [];

  // Frontmatter
  lines.push("---");
  lines.push(`title: "${noriName}"`);
  lines.push(`description: "API reference for ${noriName} in Nori"`);
  lines.push("sidebar:");
  lines.push(`  label: "${noriName}"`);
  lines.push("---");
  lines.push("");

  // Type description
  if (desc && desc.description) {
    lines.push(desc.description);
  } else {
    lines.push(`API reference for ${noriName}.`);
  }
  lines.push("");

  // Properties section
  if (processed.properties.length > 0) {
    lines.push("## Properties");
    lines.push("");
    lines.push("| Property | Type | Access |");
    lines.push("|----------|------|--------|");

    for (const prop of processed.properties) {
      const access = [prop.hasGet ? "get" : null, prop.hasSet ? "set" : null]
        .filter(Boolean)
        .join(", ");
      const type = escapeCell(prop.type || "unknown");
      lines.push(`| ${escapeCell(prop.name)} | ${type} | ${access} |`);
    }
    lines.push("");

    // Add descriptions for properties that have them
    if (desc && desc.properties) {
      for (const prop of processed.properties) {
        const propDesc = desc.properties[prop.name];
        if (propDesc) {
          lines.push(`### ${prop.name}`);
          lines.push("");
          if (propDesc.description) {
            lines.push(propDesc.description);
            lines.push("");
          }
          if (propDesc.example) {
            lines.push("```rust");
            lines.push(propDesc.example);
            lines.push("```");
            lines.push("");
          }
        }
      }
    }
  }

  // Methods section
  if (processed.methods.length > 0) {
    lines.push("## Methods");
    lines.push("");

    for (const method of processed.methods) {
      lines.push(`### ${method.name}`);
      lines.push("");
      lines.push("```");
      for (const sig of method.overloads) {
        lines.push(formatSignature(method.name, sig));
      }
      lines.push("```");
      lines.push("");

      // Add description from api-descriptions.json if available
      if (desc && desc.methods) {
        const methodDesc = desc.methods[method.name];
        if (methodDesc) {
          if (methodDesc.description) {
            lines.push(methodDesc.description);
            lines.push("");
          }
          if (methodDesc.example) {
            lines.push("```rust");
            lines.push(methodDesc.example);
            lines.push("```");
            lines.push("");
          }
        }
      }
    }
  }

  const outPath = path.join(outputDir, fileName);
  fs.writeFileSync(outPath, lines.join("\n"), "utf-8");
  tier1Count++;
}

// ---------------------------------------------------------------------------
// Generate Tier 2 namespace index pages
// ---------------------------------------------------------------------------

// Group tier 2 types by namespace
const tier2ByNamespace = new Map();
for (const processed of tier2) {
  const ns = processed.namespace || "Other";
  if (!tier2ByNamespace.has(ns)) {
    tier2ByNamespace.set(ns, []);
  }
  tier2ByNamespace.get(ns).push(processed);
}

// Sort types within each namespace
for (const types of tier2ByNamespace.values()) {
  types.sort((a, b) => a.noriName.localeCompare(b.noriName));
}

let tier2Count = 0;

for (const [ns, types] of [...tier2ByNamespace.entries()].sort((a, b) =>
  a[0].localeCompare(b[0])
)) {
  // Create a display name and filename for the namespace
  const nsDisplay = ns || "Other";
  const nsLabel = `${nsDisplay} (Other)`;
  const nsFileName =
    toKebabCase(nsDisplay.replace(/\./g, "-")) + "-other.md";

  const lines = [];

  // Frontmatter
  lines.push("---");
  lines.push(`title: "${nsDisplay} (Other Types)"`);
  lines.push(
    `description: "Additional ${nsDisplay} types available in Nori"`
  );
  lines.push("sidebar:");
  lines.push(`  label: "${nsLabel}"`);
  lines.push("---");
  lines.push("");

  // Table
  lines.push("| Type | Properties | Methods |");
  lines.push("|------|-----------|---------|");

  for (const processed of types) {
    const propCount = processed.properties.length;
    const methodCount = processed.methods.length;
    lines.push(
      `| ${escapeCell(processed.noriName)} | ${propCount} | ${methodCount} |`
    );
  }
  lines.push("");

  const outPath = path.join(outputDir, nsFileName);
  fs.writeFileSync(outPath, lines.join("\n"), "utf-8");
  tier2Count++;
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(
  `Generated ${tier1Count} tier 1 page(s), ${tier2Count} tier 2 namespace page(s). ` +
    `Total types processed: ${processedTypes.size}. ` +
    `Output: ${outputDir}`
);
