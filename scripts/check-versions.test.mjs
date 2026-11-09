import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const validatorPath = fileURLToPath(new URL("./check-versions.mjs", import.meta.url));

function skill(version, instructions = "Do the task.") {
  return [
    "---",
    "name: throughline",
    "description: A focused test fixture for a versioned skill.",
    "metadata:",
    "  author: fixture",
    '  version: "' + version + '"',
    "---",
    "",
    "# Throughline",
    instructions,
    "",
  ].join("\n");
}

test("skill edits must bump the version, and tags must match", () => {
  const root = mkdtempSync(join(tmpdir(), "skill-version-check-"));
  try {
    const scriptDir = join(root, "scripts");
    const skillDir = join(root, "skills", "throughline");
    mkdirSync(scriptDir, { recursive: true });
    mkdirSync(skillDir, { recursive: true });
    copyFileSync(validatorPath, join(scriptDir, "check-versions.mjs"));
    writeFileSync(join(skillDir, "SKILL.md"), skill("0.1.0"));\n    mkdirSync(join(skillDir, "references"), { recursive: true });\n    writeFileSync(join(skillDir, "references", "sample.md"), "A reusable reference.\n");;

    const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
    const run = (...args) => spawnSync(
      process.execPath, [join(scriptDir, "check-versions.mjs"), ...args],
      { cwd: root, encoding: "utf8" },
    );

    git("init", "-q");
    git("config", "user.email", "skill-test@example.invalid");
    git("config", "user.name", "Skill Version Test");
    git("add", ".");
    git("commit", "-qm", "initial skill");
    const base = git("rev-parse", "HEAD");
    assert.equal(run().status, 0, "a complete versioned skill should pass");
    assert.equal(run("--tag", "throughline-v0.1.0").status, 0, "matching tags should pass");
    assert.notEqual(run("--tag", "throughline-v0.1.1").status, 0, "mismatched tags must fail");\n\n    rmSync(join(skillDir, "references", "sample.md"));\n    git("add", ".");\n    git("commit", "-qm", "remove reference without version bump");\n    assert.notEqual(run("--base", base).status, 0, "deleting a skill resource without a bump must fail");

    writeFileSync(join(skillDir, "SKILL.md"), skill("0.1.0", "Updated instructions."));
    git("add", ".");
    git("commit", "-qm", "change without bump");
    assert.notEqual(run("--base", base).status, 0, "changes without a version bump must fail");

    writeFileSync(join(skillDir, "SKILL.md"), skill("0.1.1", "Updated instructions."));
    git("add", ".");
    git("commit", "-qm", "bump patch");
    assert.equal(run("--base", base).status, 0, "a higher version should pass");
    assert.equal(run("--tag", "throughline-v0.1.1").status, 0, "new tag must match");
    assert.notEqual(run("--tag", "throughline-v0.1.0").status, 0, "old tag must not match");

    writeFileSync(join(skillDir, "SKILL.md"), skill("0.1.01", "Updated instructions."));
    assert.notEqual(run().status, 0, "invalid versions must fail");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
