import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const checker = fileURLToPath(new URL("./check-skill.mjs", import.meta.url));

function makeSkill(root, name, { version = "0.1.0", link = "references/guide.md" } = {}) {
  const location = join(root, "skills", name);
  mkdirSync(join(location, "references"), { recursive: true });
  writeFileSync(join(location, "SKILL.md"), [
    "---", "name: " + name,
    "description: Use this skill to create and check a sample artifact.",
    "metadata:", "  author: 0xBUFF", '  version: "' + version + '"',
    "---", "", "# " + name, "",
    "Read [the guide](" + link + ") for details.", "",
  ].join("\n"));
  writeFileSync(join(location, "references", "guide.md"), "# Guide\n\nFollow the steps.\n");
  writeFileSync(join(root, "evals", name + ".json"), JSON.stringify({
    skill_name: name,
    evals: Array.from({ length: 3 }, (_, i) => ({
      id: i + 1, prompt: "Test task " + i, expected_output: "Expected result", files: [],
    })),
  }));
}

test("general catalog checker validates multiple independent skills", () => {
  const root = mkdtempSync(join(tmpdir(), "skill-catalog-check-"));
  try {
    mkdirSync(join(root, "scripts"), { recursive: true });
    mkdirSync(join(root, "evals"), { recursive: true });
    copyFileSync(checker, join(root, "scripts", "check-skill.mjs"));
    writeFileSync(join(root, "AGENTS.md"), "# Instructions\nUse skills/<name>/SKILL.md.\n");
    writeFileSync(join(root, "README.md"), [
      "# Skills",
      "npx skills add example/skills --skill first-skill",
      "npx skills add example/skills --skill next-skill",
    ].join("\n"));
    makeSkill(root, "first-skill");
    makeSkill(root, "next-skill");

    const run = () => spawnSync(process.execPath, [join(root, "scripts", "check-skill.mjs")], {
      cwd: root, encoding: "utf8",
    });

    assert.equal(run().status, 0, "both valid skills should pass");
    makeSkill(root, "next-skill", { link: "../first-skill/SKILL.md" });
    assert.notEqual(run().status, 0, "one skill must not depend on another's files");
    makeSkill(root, "next-skill", { link: "references/guide.md", version: "0.1.01" });
    assert.notEqual(run().status, 0, "non-semver metadata.version should fail");
    makeSkill(root, "next-skill");
    assert.equal(run().status, 0, "restoring the valid second skill should pass");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
