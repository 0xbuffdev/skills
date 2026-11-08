import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const skillRoot = join(root, "skills", "throughline");
const skillPath = join(skillRoot, "SKILL.md");
const skill = readFileSync(skillPath, "utf8");

const frontmatter = /^---\r?\n([\s\S]+?)\r?\n---\r?\n/.exec(skill);
assert.ok(frontmatter, "SKILL.md needs YAML frontmatter");
const metadata = frontmatter[1];
assert.match(metadata, /^name:\s*throughline\s*$/m);
assert.match(metadata, /^description:\s*\S.{80,}$/m, "Description must explain when to use the skill");
assert.ok(metadata.length < 1800, "Keep always-loaded metadata concise");

const description = metadata.match(/^description: (.+)$/m)?.[1];
assert.ok(description && description.length <= 1024, "Description must fit the standard's 1024 character limit");
const compatibility = metadata.match(/^compatibility: (.+)$/m)?.[1];
if (compatibility) assert.ok(compatibility.length <= 500, "Compatibility must fit the standard's 500 character limit");
const declaredMetadata = metadata.match(/^metadata:\r?\n((?: {2}[^\r\n]+\r?\n?)+)/m)?.[1];
assert.ok(declaredMetadata, "Use a metadata mapping for the skill version");
const version = declaredMetadata.match(/^ {2}version: "(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)"\s*$/m);
assert.ok(version, "Skill version must be a quoted X.Y.Z value in metadata.version");
assert.match(declaredMetadata, /^ {2}author: \S+/m, "Include the skill author in metadata");

const referencePaths = [
  "references/grammar.md",
  "references/domains.md",
  "references/integration.md",
  "references/api-and-validation.md",
];

for (const path of referencePaths) {
  assert.ok(skill.includes("](" + path + ")"), "SKILL.md must link to " + path);
  assert.ok(existsSync(join(skillRoot, path)), "Missing reference: " + path);
}
for (const domain of ["flow", "bindings", "binary", "matrix", "callstack"]) {
  assert.ok(skill.includes(domain), "Missing domain: " + domain);
}

// Public skill documents must stand alone and use working local links.
for (const path of ["SKILL.md", ...referencePaths]) {
  const fullPath = join(skillRoot, path);
  const content = readFileSync(fullPath, "utf8");
  assert.doesNotMatch(content, /https?:\/\/|skills\.sh|github\.com\//i, path + ": avoid external links");
  assert.doesNotMatch(content, /\b(?:upstream|source repository|planned domain)\b/i, path + ": remove developer-only wording");
  const links = [...content.matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)].map(match => match[1]);
  for (const link of links) {
    assert.ok(!isAbsolute(link), path + ": links must be relative");
    const target = resolve(dirname(fullPath), link);
    const inside = relative(skillRoot, target);
    assert.ok(!inside.startsWith(".." + sep) && inside !== "..", path + ": link points outside the skill: " + link);
    assert.ok(existsSync(target), path + ": broken link: " + link);
  }
}

const readme = readFileSync(join(root, "README.md"), "utf8");
assert.ok(readme.includes("github.com/0xbuffdev/skills --skill throughline"));
assert.doesNotMatch(readme, /skills\.sh|indexing|discoverab/i);
const agents = readFileSync(join(root, "AGENTS.md"), "utf8");
assert.ok(agents.includes("node scripts/check-skill.mjs"));
assert.ok(agents.includes("node scripts/smoke-throughline.mjs"));
assert.ok(agents.split(/\r?\n/).length <= 150, "Keep the root AGENTS.md focused");

const evals = JSON.parse(readFileSync(join(root, "evals", "throughline.json"), "utf8"));
assert.equal(evals.skill_name, "throughline");
assert.ok(evals.evals.length >= 3);
for (const test of evals.evals) {
  assert.ok(test.prompt && test.expected_output && Array.isArray(test.files));
}
console.log("Throughline skill files, local links, and evaluation cases: OK");
