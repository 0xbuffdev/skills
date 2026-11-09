# Agent instructions

This repository contains public skills that help coding agents complete real tasks. It does not contain the applications or libraries those skills describe.

## Repository layout

- `README.md`: installation and short descriptions for people browsing the repository.
- `skills/<name>/SKILL.md`: a skill's entry point, written for agents using the technology on behalf of a user.
- `skills/<name>/references/`: complete task-focused instructions bundled with the skill.
- `skills/<name>/scripts/`: runnable helpers needed by users of the skill.
- `skills/<name>/assets/`: reusable, tested example files and templates included with the skill.
- `evals/throughline.json`: realistic tasks that check whether the Throughline skill helps.
- `scripts/check-skill.mjs`, `scripts/check-versions.mjs`, and `scripts/smoke-throughline.mjs`: skill checks, release versions, and example compatibility.
- `.github/workflows/validate.yml`: automated checks on pull requests.

## Rules for skills

- Write for the agent **using the skill**, not for agents maintaining this repository or changing the underlying library.
- Skills must be self-contained. Explain the syntax, behavior, imports, limitations, errors, and working examples in `SKILL.md` or files within the same skill folder. Do not send users to another repository for missing instructions.
- Keep `SKILL.md` clear and short. Place detailed material in local `references/` files and link to them using relative paths, with a clear reason to read each one.
- Use plain, direct language. Explain a necessary technical term once; remove unnecessary terms, promotional copy, and publication-status information.
- Frontmatter must include the skill's exact `name` and a `description` that clearly says when the skill should be used.
- Give each skill its own quoted `metadata.version: "MAJOR.MINOR.PATCH"` in `SKILL.md`. Versions are independent of the packages the skill describes. Increase patch for corrections, minor for new capabilities, and major for incompatible skill changes.
- Any change under `skills/<name>/` requires a higher version in that skill's `SKILL.md`; `scripts/check-versions.mjs --base <base-commit>` enforces this on pull requests. New skills start at an explicit version. Changes outside skill folders do not require a bump.
- After final review, signing, and merge, a maintainer may authorize a tag such as `throughline-v0.1.0` at the merged commit. Tag names must match the skill's declared version; never move a published tag. The Skills CLI can install a pinned revision with `npx skills add 0xbuffdev/skills@throughline-v0.1.0 --skill throughline` once that tag exists.
- Document only released behavior. For Throughline, keep examples compatible with `@0xbuff/throughline@0.0.2` and its four supported package imports. Do not invent domains or React props.
- Never include credentials, private information, instructions to run untrusted code, or claims that checks passed without actually running them.
- When changing a skill's documented behavior, update the relevant examples, checks, and evaluation scenarios together. Never create empty skill subdirectories purely for appearance.

## Checks

Run from the repository root:

~~~sh
node scripts/check-skill.mjs
node scripts/check-versions.mjs
npm install --no-save --no-package-lock --ignore-scripts @0xbuff/throughline@0.0.2
node scripts/smoke-throughline.mjs
npx --yes skills add . --list
~~~

For installation checks, run the CLI from a temporary working directory outside this repository, targeting both Claude Code and Codex:

~~~sh
SKILLS_REPO="$(pwd)"
cd "$(mktemp -d)"
npx --yes skills add "$SKILLS_REPO" --skill throughline -a claude-code -a codex -y
~~~

CI also checks installation. Do not commit installed `node_modules/`, temporary agent directories, or generated artifacts.

## Changes

Work on a dedicated branch and open a focused pull request. State what changed and which checks actually ran. Final review, any required signing, and merging remain maintainer actions unless explicitly authorized.
