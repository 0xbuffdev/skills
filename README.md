# 0xBUFF Agent Skills

Agent skills for building with 0xBUFF technology. Each skill follows the open [Agent Skills](https://agentskills.io) format and is installable with the [skills CLI](https://github.com/vercel-labs/skills).

## Available skills

| Skill | Purpose | Version reference |
| --- | --- | --- |
| [throughline](skills/throughline/SKILL.md) | Author, validate, debug and integrate deterministic Throughline state visualizations in TypeScript, Markdown/MDX and React applications | `@0xbuff/throughline` 0.0.2 |

## Install

Run in a project that uses an AI coding agent:

~~~sh
npx skills add https://github.com/0xbuffdev/skills --skill throughline
~~~

For a global install, add `-g`. To select a specific supported agent, pass `-a <agent>`; otherwise use the CLI's agent selection. Inspect the discovered skill before installing:

~~~sh
npx skills add https://github.com/0xbuffdev/skills --list
~~~

This installs **agent instructions**, not the Throughline runtime. Projects using the runtime must separately install `@0xbuff/throughline` (and React 19 / React DOM 19 if using the optional player).

## What agents learn

- Choose accurately among `flow`, `bindings`, `binary`, `matrix` and `callstack`.
- Write valid `thl` code fences and deterministic, understandable state transitions.
- Compile and verify source instead of inventing language features or public APIs.
- Use the React 19 player with the supported imports, explicit stylesheet and stable trace identity.
- Integrate Markdown or Fumadocs/MDX through an explicit host renderer; ordinary fenced code does not become a live visualization automatically.
- Handle diagnostics and runtime boundaries without executing untrusted authored text.

The short [SKILL.md](skills/throughline/SKILL.md) directs agents to focused reference files only when needed. Authoritative source is [Throughline v0.0.2](https://github.com/0xbuffdev/throughline) and its [documentation](https://github.com/0xbuffdev/throughline/tree/main/docs). Review installed dependency versions before applying version-specific guidance.

## Testing and publication

Skill maintainers should check the frontmatter and referenced files, review code examples against the published package, and use the scenarios in [evals](evals/throughline.json). After merging to the default branch, verify the `--list` and `--skill throughline` CLI paths in a clean environment.

[skills.sh](https://skills.sh) discovers public skills based on installations recorded by the skills CLI. Merging a GitHub skill does **not** itself guarantee immediate listing or search placement. The eventual canonical listing path should be `https://skills.sh/0xbuffdev/skills/throughline` once indexed.

## Ownership

Maintained by 0xBUFF. Propose changes in a dedicated branch and pull request; final signing, review and merge remain maintainer actions.
