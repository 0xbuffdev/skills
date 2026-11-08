---
name: throughline
description: Build, author, validate, debug, document, and integrate Throughline state-trace visualizations using @0xbuff/throughline. Use whenever a task mentions Throughline, thl Markdown fences, state-over-time animations, its five domains (flow, bindings, binary, matrix, callstack), the React player, or embedding Throughline in MDX, Fumadocs, Next.js, or educational content. Apply this skill even when the user asks only for an example, fix, lesson visualization, or integration.
---

# Throughline — agent implementation skill

Target the published **`@0xbuff/throughline` 0.0.2** contract unless the consuming project has a different installed version. Throughline is a TypeScript/ESM compiler of authored state traces into deterministic frames, with an optional React 19 player. It is not a JavaScript interpreter, an automatic code tracer, or an SVG chart generator.

## Reliable execution workflow

1. **Inspect the consuming project.** Read its `AGENTS.md` instructions and relevant code, determine the installed Throughline version, runtime (Node 24+ for v0.0.2), React version and Markdown/MDX pipeline. Prefer actual package types/exports to guesses. If behavior differs from this skill, inspect the installed package and report the discrepancy.
2. **Choose the right domain.** Use `flow` for hand-authored concepts, pipelines, protocols, arbitrary algorithms and workflows; `bindings` for the restricted variable/reference/push language; `binary` for unsigned ripple-carry addition; `matrix` for small multiplication; `callstack` for factorial recursion only. Read [domains](references/domains.md) before using a computed domain. Never invent unsupported domains such as `search`, `sort`, `tcp` or `gradient`: they are plans, not v0.0.2 APIs.
3. **Design the explanation before writing syntax.** Specify the initial state and exact sequence of visible changes. Give each beat one understandable purpose; choose real values and source-grounded notes. Identify what changes, what merely highlights, and whether a transfer should precede or accompany a write.
4. **Author valid input.** For `flow`, read [grammar](references/grammar.md). Declare all groups/nodes/links first, then named steps. Only write JSON values and supported operations. Use hidden entities/links for future topology. Make diagrams truthful, not merely visually plausible.
5. **Compile and inspect.** Compile **one** `thl <domain>` block with `compile(source)` (or host-extracted `ThlBlock` with `compileAst(ast)`). Do not pass an entire Markdown document or multiple fences to `compile`. Fail on `ProgramError`, with source-positioned diagnostics where available. Check initial frame, beat count, final values, transfers, visibility and note semantics against the user's intended explanation.
6. **Integrate the supported surface.** Compiler-only consumers import from `@0xbuff/throughline`. React consumers import `ThroughlinePlayer` from `@0xbuff/throughline/react` and CSS from `@0xbuff/throughline/styles/throughline.css`. For MDX/Fumadocs, implement or reuse an explicit code-block-to-player integration; a syntax-highlighted `thl` fence is *not* interactive by default. Read [integration](references/integration.md).
7. **Verify and report.** Run typechecking, compilation tests, React/SSR/browser tests as applicable. Distinguish checks that actually ran from examples or suggested commands. Report version assumptions, errors and unverified execution honestly. Use [API and validation](references/api-and-validation.md) for precise exports and assertions.

## Minimal, correct authored trace

~~~markdown
```thl flow
node counter "Counter" as number = 0
step "Increment"
  set counter = 1
  focus counter
  note "Counter is now one."
```
~~~

~~~ts
import { compile } from "@0xbuff/throughline";

const source = [
  "```thl flow",
  'node counter "Counter" as number = 0',
  'step "Increment"',
  "  set counter = 1",
  "  focus counter",
  '  note "Counter is now one."',
  "```",
].join("\n");

const trace = compile(source);
if (trace.frames.length !== 2) throw new Error("Expected initial + increment frames");
~~~

`trace.version === 1` is the **trace schema**, not package version `0.0.2`. Frame 0 is initial state, followed by one frame per step. Seeking reads compiled snapshots; it does not recompute the program.

## Invariants that prevent common mistakes

- **`send` does not mutate** the destination. Use `set` for actual state changes. A `focus`/`note` annotates a beat; neither updates state.
- **Never assume every `set` produces a visible value change.** A same-value write may not highlight a change. Use separate beats and meaningful focus/notes as necessary.
- **Do not overlap writes within a single step** (such as `set data = [...]` plus `set data[0] = ...`). Compilation rejects conflicting parent/child targets.
- **Do not transfer over hidden links/endpoints.** Predeclare future items with `hidden`, then `show` them before a transfer that uses them.
- **Do not write arbitrary JS expressions** inside `thl`. Values are finite JSON; strings must be double-quoted.
- **Do not invent player props or deep imports.** No `source`, `steps`, `autoplay` or `children` player props; pass a compiled `trace`.
- **Do not recompile per React render** or replace the trace object on every step. Replacing trace identity resets playback.
- **No React requirement for the compiler.** Add React 19 dependencies only if rendering the optional player.
- **No automatic Markdown scanning.** Extract exactly one intended `thl` block through the host Markdown parser. Fences inside normal prose do not run themselves.
- **Do not silently add capabilities.** Version 0.0.2 provides five domains and exactly four public package export paths.

## Load focused references as required

- [Flow grammar, state and visualization semantics](references/grammar.md): when authoring or debugging `thl flow`.
- [Computed domain syntax, boundaries and examples](references/domains.md): whenever using `bindings`, `binary`, `matrix`, or `callstack`.
- [React, SSR and Fumadocs/MDX integration](references/integration.md): for app, docs or web work.
- [Public API, diagnostics, limits and test checklist](references/api-and-validation.md): for library calls, programmatic traces, failures and acceptance tests.

## Authoritative sources

Review the [source README](https://github.com/0xbuffdev/throughline/blob/main/README.md), [grammar](https://github.com/0xbuffdev/throughline/blob/main/docs/grammar.md), [domain catalog](https://github.com/0xbuffdev/throughline/blob/main/docs/catalog.md), [architecture](https://github.com/0xbuffdev/throughline/blob/main/docs/architecture.md), and [published exports](https://github.com/0xbuffdev/throughline/blob/main/package.json) when accuracy depends on the exact installed version. If implementing a *new computed domain in the Throughline package itself*, follow its [adapter guide](https://github.com/0xbuffdev/throughline/blob/main/docs/authoring.md) and repository instructions; this is different from consuming the published package.
