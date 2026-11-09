import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const skillsRoot = join(root, "skills");
const namePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

function filesUnder(folder) {
  if (!existsSync(folder)) return [];
  return readdirSync(folder, { withFileTypes: true })
    .flatMap((entry) => entry.isDirectory()
      ? filesUnder(join(folder, entry.name))
      : entry.isFile() ? [join(folder, entry.name)] : []);
}

function frontmatter(source, path) {
  const match = /^---\r?\n([\s\S]+?)\r?\n---(?:\r?\n|$)/.exec(source);
  assert.ok(match, path + ": missing YAML frontmatter");
  return match[1];
}

function checkLocalLinks(source, path, skillRoot) {
  // These are Markdown document links, not inline syntax in code blocks.
  for (const [, href] of source.matchAll(/\]\(([^)]+)\)/g)) {
    if (href.startsWith("#")) continue;
    const link = href.split("#")[0].split("?")[0];
    if (!link) continue;
    assert.ok(!/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(link), path + ": links must be local to this skill: " + href);
    assert.ok(!isAbsolute(link), path + ": absolute link: " + href);
    const target = resolve(dirname(path), decodeURIComponent(link));
    const local = relative(skillRoot, target);
    assert.ok(local !== ".." && !local.startsWith(".." + sep) && !isAbsolute(local),
      path + ": link escapes skill folder: " + href);
    assert.ok(existsSync(target) && statSync(target).isFile(), path + ": missing linked file: " + href);
  }
}

assert.ok(existsSync(skillsRoot), "Missing skills/ directory");
const directories = readdirSync(skillsRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory());
assert.ok(directories.length > 0, "No skills found");

const readme = readFileSync(join(root, "README.md"), "utf8");
const agents = readFileSync(join(root, "AGENTS.md"), "utf8");
assert.ok(agents.includes("skills/<name>/SKILL.md"), "AGENTS.md must describe the multi-skill layout");
assert.doesNotMatch(readme, /skills\.sh|indexing|discoverab/i, "Keep the public catalog focused on usage");

for (const entry of directories) {
  const name = entry.name;
  const skillRoot = join(skillsRoot, name);
  const mainPath = join(skillRoot, "SKILL.md");
  assert.match(name, namePattern, name + ": invalid skill directory name");
  assert.ok(existsSync(mainPath), name + ": missing required SKILL.md");

  const source = readFileSync(mainPath, "utf8");
  const meta = frontmatter(source, mainPath);
  assert.equal(/^name:\s*['"]?([^\s'"]+)['"]?\s*$/m.exec(meta)?.[1], name, name + ": frontmatter name must match directory");
  const description = /^description:\s*(.*)$/m.exec(meta)?.[1];
  assert.ok(description && description.trim(), name + ": missing description");
  // Full YAML length and syntax, including folded descriptions, are checked by skills-ref in CI.
  const mapping = /^metadata:\s*\r?\n((?: {2}[^\r\n]+\r?\n?)+)/m.exec(meta)?.[1];
  assert.ok(mapping, name + ": expected metadata mapping");
  const version = /^ {2}version:\s*"([^"]+)"\s*$/m.exec(mapping)?.[1];
  assert.ok(version && versionPattern.test(version), name + ": version must be quoted MAJOR.MINOR.PATCH");
  assert.match(mapping, /^ {2}author:\s*\S+/m, name + ": metadata.author is required");
  assert.ok(readme.includes("--skill " + name), name + ": add an installation command to README.md");

  const docs = [mainPath, ...filesUnder(join(skillRoot, "references")).filter((p) => p.endsWith(".md"))];
  for (const doc of docs) {
    const text = readFileSync(doc, "utf8");
    assert.ok(text.trim(), doc + ": document is empty");
    assert.doesNotMatch(text, /https?:\/\/|skills\.sh|github\.com\//i, doc + ": keep instructions self-contained");
    checkLocalLinks(text, doc, skillRoot);
  }
  for (const resource of filesUnder(join(skillRoot, "references"))) {
    const local = relative(skillRoot, resource).replaceAll(sep, "/");
    assert.ok(source.includes(local), name + ": link reference from SKILL.md: " + local);
  }

  const evalPath = join(root, "evals", name + ".json");
  assert.ok(existsSync(evalPath), name + ": add an evaluation fixture at evals/" + name + ".json");
  const evals = JSON.parse(readFileSync(evalPath, "utf8"));
  assert.equal(evals.skill_name, name, name + ": evaluation skill_name mismatch");
  assert.ok(Array.isArray(evals.evals) && evals.evals.length >= 3, name + ": need at least three evaluation scenarios");
  for (const test of evals.evals) {
    assert.ok(typeof test.prompt === "string" && test.prompt.trim(), name + ": evaluation prompt missing");
    assert.ok(typeof test.expected_output === "string" && test.expected_output.trim(),
      name + ": evaluation expectation missing");
    assert.ok(Array.isArray(test.files), name + ": evaluation files must be an array");
  }
  console.log(name + ": metadata, version, self-contained references, catalog, and evals OK");
}
