import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const skillPath = join(root, "skills", "throughline", "SKILL.md");
const skill = readFileSync(skillPath, "utf8");

const frontmatter = /^---\r?\n([\s\S]+?)\r?\n---\r?\n/.exec(skill);
assert.ok(frontmatter, "SKILL.md needs YAML frontmatter");
const metadata = frontmatter[1];
assert.match(metadata, /^name:\s*throughline\s*$/m);
assert.match(metadata, /^description:\s*\S.{80,}$/m, "Description must trigger relevant tasks");
assert.ok(metadata.length < 1800, "Keep always-loaded metadata concise");

const references = [...skill.matchAll(/\]\((references\/[^)#]+\.md)\)/g)].map(m => m[1]);
assert.ok(references.length >= 4, "Include references for authoring, domains, integration, validation");
for (const relative of references) {
  assert.ok(existsSync(join(dirname(skillPath), relative)), "Missing reference: " + relative);
}
for (const domain of ["flow", "bindings", "binary", "matrix", "callstack"]) {
  assert.ok(skill.includes(domain), "Missing supported domain: " + domain);
}

const readme = readFileSync(join(root, "README.md"), "utf8");
assert.ok(readme.includes("github.com/0xbuffdev/skills --skill throughline"));
const evals = JSON.parse(readFileSync(join(root, "evals", "throughline.json"), "utf8"));
assert.equal(evals.skill_name, "throughline");
assert.ok(evals.evals.length >= 3);
for (const test of evals.evals) {
  assert.ok(test.prompt && test.expected_output && Array.isArray(test.files));
}
console.log("Throughline skill structure and evaluation cases: OK");
