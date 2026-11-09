# AGENTS.md

Instructions for agents changing this repository. The repository is a catalog of independently installable 0xBUFF Agent Skills, not a workspace for the applications described by the skills.

## Read before editing

1. Read this file, `README.md`, and any nested `AGENTS.md` covering the files you will modify.
2. Read the existing `SKILL.md`, its linked resources, and relevant tests before rewriting a skill.
3. Follow the [Agent Skills specification](https://agentskills.io/specification) and its official skill-creation guidance. The `skills/<name>/SKILL.md` format is the source of truth for each skill's structure.
4. Verify all product syntax, APIs, version constraints, and examples against the actual released product. Do not invent features or document unreleased behavior.

## Repository structure

- `skills/<name>/SKILL.md`: the required entry point. Folder name and frontmatter `name` must match.
- `skills/<name>/references/`: optional focused guides referenced by relative paths from `SKILL.md`.
- `skills/<name>/scripts/`: optional self-contained helpers users can run.
- `skills/<name>/assets/`: optional complete examples or templates used by the skill.
- `evals/<name>.json`: task examples that test the corresponding skill.
- `scripts/`: repository-wide checks and, when necessary, explicitly named product-specific smoke tests.
- `.github/workflows/validate.yml`: specification, structural, versioning, sample, and installation checks.
- `README.md`: installation catalog for the people selecting a skill.

Do not add empty optional directories, shared runtime dependencies, or cross-skill imports. A skill must remain usable if installed alone.

## Skill-writing rules

- Address an agent **using** the skill to solve a user's task, not an agent developing the underlying library.
- Put the trigger conditions and task scope in `description`. Write concise, imperative instructions in `SKILL.md`, with one minimal working example and an ordered workflow.
- Use progressive disclosure: point directly to local `references/` files for advanced scenarios. Do not send the agent to another repository to complete normal usage.
- Include actual supported imports, constraints, known failure modes, and a verification path. Do not claim code was run unless it was.
- Keep all links inside a skill local to that skill and relative. Keep each referenced file focused and avoid deep reference chains.
- Use frontmatter `name` and `description` as specified by Agent Skills. Add quoted `metadata.version: "MAJOR.MINOR.PATCH"` and `metadata.author` for this catalog. Only add `compatibility` for concrete requirements.
- Never add credentials, private information, generated agent installation folders, or unaudited executable downloads.

## Independent skill releases

- Any addition, edit, or removal of a file under `skills/<name>/` requires a higher `metadata.version` in that skill's `SKILL.md`.
- Use a patch increase for fixes, minor for backward-compatible new capabilities, and major for incompatible skill behavior.
- Start new skills with an explicit version, add an entry to `README.md`, and add realistic evaluation cases and any necessary domain-specific tests.
- Keep release tags immutable and skill-specific: `<name>-vMAJOR.MINOR.PATCH`. Tags are created only when the user authorizes a release after review and merge. Do not claim a tag exists because a version is present in the file.
- Keep versions of packages described by a skill separate from the **skill's** version.

## Throughline contract

- Throughline currently documents `@0xbuff/throughline@0.0.2` and its supported root, `/react`, `/examples`, and `/styles/throughline.css` exports.
- Keep the `flow`, `bindings`, `binary`, `matrix`, and `callstack` examples valid. The compiler supports a single `thl` block per call.
- Update `evals/throughline.json` and `scripts/smoke-throughline.mjs` when changing observable Throughline guidance.

## Verification

Run from the repository root:

```sh
node scripts/check-skill.mjs
node --test scripts/check-skill.test.mjs scripts/check-versions.test.mjs
node scripts/check-versions.mjs
npm install --no-save --no-package-lock --ignore-scripts @0xbuff/throughline@0.0.2
node scripts/smoke-throughline.mjs
npx --yes skills add . --list
```

For a changed branch, also run `node scripts/check-versions.mjs --base <full-base-commit-sha>`. CI runs the official `skills-ref` validator and checks installation into Claude Code and Codex. Only report the checks actually completed.

## Change workflow

Use a dedicated branch and open a focused pull request against `main`. Explain the skill behavior, compatibility, structural changes, and validation evidence. This project has one maintainer: final review, required signing, merge, and release tagging remain maintainer actions unless explicitly authorized. Do not fabricate results or bypass checks.
