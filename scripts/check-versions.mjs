import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const skillsDir = join(root, "skills");
const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

function readVersion(source, name) {
  const frontmatter = /^---\r?\n([\s\S]+?)\r?\n---(?:\r?\n|$)/.exec(source)?.[1];
  assert.ok(frontmatter, name + ": missing SKILL.md YAML frontmatter");
  assert.match(frontmatter, new RegExp("^name:\s*" + name + "\s*$", "m"), name + ": name must match its folder");
  const attributes = /^metadata:\r?\n((?: {2}[^\r\n]+\r?\n?)+)/m.exec(frontmatter)?.[1];
  assert.ok(attributes, name + ": a metadata mapping is required by this repository's release policy");
  const value = /^ {2}version:\s*"([^"]+)"\s*$/m.exec(attributes)?.[1];
  assert.ok(value && semver.test(value), name + ': metadata.version must be a quoted "MAJOR.MINOR.PATCH"');
  return value;
}

function compareVersions(a, b) {
  const left = a.split(".").map(BigInt);
  const right = b.split(".").map(BigInt);
  for (let i = 0; i < 3; i++) {
    if (left[i] > right[i]) return 1;
    if (left[i] < right[i]) return -1;
  }
  return 0;
}

function git(...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

const skills = readdirSync(skillsDir, { withFileTypes: true })
  .filter(entry => entry.isDirectory() && existsSync(join(skillsDir, entry.name, "SKILL.md")))
  .map(entry => entry.name).sort();

assert.ok(skills.length > 0, "No skills with SKILL.md found");
const versions = new Map(skills.map(name => [
  name, readVersion(readFileSync(join(skillsDir, name, "SKILL.md"), "utf8"), name),
]));

const args = process.argv.slice(2);
if (args.length === 0) {
  // The basic check needs no git history.
} else if (args.length === 2 && args[0] === "--base") {
  const base = args[1];
  assert.match(base, /^[0-9a-f]{40}$/i, "Use a full commit SHA as the base");
  git("cat-file", "-e", base + "^{commit}");
  const changed = git("diff", "--name-only", "--diff-filter=ACMR", base, "HEAD", "--", "skills/")
    .split("\n").filter(Boolean);
  const changedNames = [...new Set(changed.map(path => /^skills\/([^/]+)\//.exec(path)?.[1]).filter(Boolean))].sort();

  for (const name of changedNames) {
    assert.ok(versions.has(name), name + ": new skill changes require a SKILL.md with version metadata");
    let prior;
    try {
      prior = git("show", base + ":skills/" + name + "/SKILL.md");
    } catch (error) {
      // An entirely new skill has no older SKILL.md to compare against.
      if (error.status !== 128) throw error;
      prior = null;
    }
    if (prior !== null) {
      const oldVersion = (() => { try { return readVersion(prior, name); } catch { return null; } })();
      if (oldVersion) {
        const nextVersion = versions.get(name);
        assert.ok(compareVersions(nextVersion, oldVersion) > 0,
          name + ": skill contents changed; increment metadata.version above " + oldVersion +
          " (current: " + nextVersion + ")");
      }
    }
    console.log(name + ": skill version " + versions.get(name) + " is valid for this change");
  }
} else if (args.length === 2 && args[0] === "--tag") {
  const tag = args[1];
  // Use the unambiguous 'skill-name-vX.Y.Z' convention.
  const separator = tag.lastIndexOf("-v");
  assert.ok(separator > 0, "Release tag must use <skill-name>-vMAJOR.MINOR.PATCH");
  const name = tag.slice(0, separator);
  const version = tag.slice(separator + 2);
  assert.match(name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.match(version, semver);
  assert.ok(versions.has(name), tag + ": no corresponding skill");
  assert.equal(versions.get(name), version, tag + ": tag and skill metadata.version do not match");
  console.log(tag + ": release tag matches the skill version");
} else {
  throw new Error("Usage: node scripts/check-versions.mjs [--base <commit-sha> | --tag <name-vX.Y.Z>]");
}

for (const [name, version] of versions) console.log(name + ": " + version);
