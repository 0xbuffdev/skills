---
name: throughline
description: Create, fix, and embed step-by-step Throughline visualizations. Use when writing thl Markdown blocks, showing state changes, teaching algorithms, working with flow, bindings, binary, matrix or callstack diagrams, using @0xbuff/throughline in TypeScript or React, integrating MDX/Fumadocs, or customizing the player.
compatibility: Node.js 24+ for the Throughline 0.0.2 runtime; React 19 for its optional player.
metadata:
  author: 0xBUFF
  version: "0.2.0"
---

# Throughline

Use this skill when someone wants to **show how something changes, one step at a time**, with Throughline. Produce working examples and integrations, not just explanations.

These instructions cover `@0xbuff/throughline` version `0.0.2`. If a project uses another version, confirm its installed exports and types before changing code.

## Get started

1. Identify what the user wants to show and where it will appear: Markdown, code, React, or a documentation page.
2. Choose a supported diagram below. Do not invent new diagram types.
3. Write the source with an initial state and clear named steps.
4. Compile it with `compile(source)`. Fix errors rather than guessing whether a diagram works.
5. For an interactive display, use `ThroughlinePlayer` with the compiled result. A `thl` code block does not become a player on its own.
6. Check the frame count and values; for an app, also check the rendered player, keyboard controls, and styles.

## Pick a diagram

| Name | Use it for |
| --- | --- |
| `flow` | A custom process, algorithm, workflow, protocol, or state change |
| `bindings` | Variables, shared objects, reassignment, and array `push` |
| `binary` | Addition of two unsigned binary numbers |
| `matrix` | Multiplication of two small matrices |
| `callstack` | The calls and returns of factorial recursion |

Use `flow` for everything not supported by the four built-in examples. In version 0.0.2, `callstack` cannot run arbitrary functions, and `bindings` does not interpret general JavaScript.

## Write a first diagram

~~~markdown
```thl flow
node counter "Counter" as number = 0
step "Increase"
  set counter = 1
  focus counter
  note "The counter is now one."
```
~~~

Compile it:

~~~ts
import { compile } from "@0xbuff/throughline";

const source = [
  "```thl flow",
  'node counter "Counter" as number = 0',
  'step "Increase"',
  "  set counter = 1",
  "  focus counter",
  '  note "The counter is now one."',
  "```",
].join("\n");

const trace = compile(source);

console.log(trace.frames.length); // 2: initial state + one step
~~~

The first frame shows `counter = 0`. The next frame shows `counter = 1`. When someone moves between frames, Throughline reads the saved values; it does not run the source again.

## Reuse an example or check your diagram

Ready-to-use diagrams are included in this skill:

- [Custom flow](assets/flow.thl) — send a value, then update its destination.
- [Variable bindings](assets/bindings.thl) — shared arrays and reassignment.
- [Binary addition](assets/binary.thl) — carry propagation.
- [Matrix multiplication](assets/matrix.thl) — calculated output cells.
- [Factorial call stack](assets/callstack.thl) — recursive calls and returns.

Copy the example that matches the task and edit its values or steps. Each file contains one complete, compilable `thl` block.

To check a diagram file, install `@0xbuff/throughline` in the user's project, then run the included [validation script](scripts/validate.mjs) from that project's root:

~~~sh
node <installed-skill-directory>/scripts/validate.mjs <diagram-file.thl>
~~~

The script uses the Throughline package installed in that project. It reports the number of frames on success, identifies invalid source and its line when available, and exits with an error on failure. Node.js 24+ is required. Always run it on the user's actual diagram after adapting an example.

## Important rules

- Declare nodes, links, and groups **before** the first `step`.
- `set` changes a value. `focus` highlights it. `note` explains it. `send` shows movement along a link but **does not change** the destination's value.
- Write values as JSON: `1`, `true`, `"ready"`, `[1,2]`, `{"ok":true}`. Do not write JavaScript expressions inside a diagram.
- If the user needs a node or link to appear later, declare it as `hidden` and reveal it with `show`. Never send data along a hidden link.
- Avoid two `set` commands that change the same target, or a target and its parent, within one step.
- Keep each step focused on one understandable change. A note is not a state update.
- Compile **one** `thl` block at a time. For a Markdown page with several blocks, extract and compile each block separately.
- Do not pass raw source to `ThroughlinePlayer`. Pass a compiled `trace`, and do not recreate that trace during every React render.

## Use the guide for the task

All supporting instructions are included in this skill:

- [Flow diagrams](references/grammar.md) — full syntax for custom diagrams, links, values, visibility, and common mistakes.
- [Other diagram types](references/domains.md) — working examples and limits for `bindings`, `binary`, `matrix`, and `callstack`.
- [Using Throughline in an app](references/integration.md) — installation, React, Next.js, Markdown/MDX, Fumadocs, CSS customization, and optional sound.
- [API and troubleshooting](references/api-and-validation.md) — functions, types, errors, limits, and ways to check the result.

## Finish the task

Give the user the source or code needed for their actual project. Check the examples against the installed package when possible, and state clearly if execution or browser behavior was not verified.
