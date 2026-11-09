---
name: throughline
description: Author, compile, debug, and embed Throughline state visualizations. Use for thl Markdown diagrams, step-by-step algorithms and state changes, variable aliasing, binary addition, matrix multiplication, factorial call stacks, TypeScript tracer programs, React players, and Markdown/MDX or Fumadocs integration with @0xbuff/throughline.
compatibility: Node.js 24+ for @0xbuff/throughline@0.0.2; React 19 and React DOM 19 for the optional player.
metadata:
  author: 0xBUFF
  version: "0.3.0"
---

# Throughline

Build accurate, step-by-step visualizations with `@0xbuff/throughline@0.0.2`. Throughline compiles one `thl` block into an initial frame and immutable frames for subsequent steps. The React player reads the frames; it does not execute authored source or recompute the diagram during playback.

## Workflow

1. Identify the learning or debugging goal, the state being shown, and the output target: Markdown, TypeScript, React, or MDX.
2. Select a supported domain from the table below. Use `flow` for a custom process; do not invent domain names or APIs.
3. Establish the initial state before describing transitions. Keep each step about one meaningful change.
4. Compile each `thl` block separately. Inspect the frames for correct state, focus, transfer, and captions; fix compiler diagnostics before delivery.
5. When rendering interactively, pass a stable compiled `trace` to `ThroughlinePlayer`, load the stylesheet once, and verify player controls and accessibility in the consuming app.
6. Deliver the actual source or integration code and report which checks were run.

## Choose a domain

| Domain | Use for | Constraints |
| --- | --- | --- |
| `flow` | Algorithms, data structures, protocols, workflows, or arbitrary authored state changes | Declare nodes and links before steps; values are JSON |
| `bindings` | Variables, shared arrays or objects, `push`, and rebinding | Limited teaching language; not arbitrary JavaScript |
| `binary` | Unsigned binary addition with carry | Exactly two operands of 1–16 bits |
| `matrix` | Small matrix multiplication | Numeric, compatible matrices of up to 4 × 4 |
| `callstack` | Recursive factorial calls and returns | `fact n` for integer `n` from 1 to 6 |

For unsupported computed operations such as Fibonacci, sorting, or a custom protocol, describe the transitions using `flow`. Read [other domains](references/domains.md) before writing non-`flow` source.

## Author and compile a flow

```thl flow
node counter "Counter" as number = 0
step "Increment"
  set counter = 1
  focus counter
  note "The counter is now one."
```

Use the complete fenced block as a string when calling the compiler:

```ts
import { compile } from "@0xbuff/throughline";

const source = [
  "```thl flow",
  'node counter "Counter" as number = 0',
  'step "Increment"',
  "  set counter = 1",
  "  focus counter",
  '  note "The counter is now one."',
  "```",
].join("\n");

const trace = compile(source);
if (trace.frames.length !== 2) throw new Error("Expected two frames");
if (trace.frames[1].state.entities.find((item) => item.id === "counter")?.value !== 1) {
  throw new Error("The counter did not update");
}
```

Frame `0` has `counter = 0`; frame `1` has `counter = 1`. A `note` explains a change but never changes a value.

## Render a player

```tsx
import { compile } from "@0xbuff/throughline";
import { ThroughlinePlayer } from "@0xbuff/throughline/react";
import "@0xbuff/throughline/styles/throughline.css";

const trace = compile([
  "```thl binary",
  "a = 1011",
  "b = 0110",
  "```",
].join("\n"));

export function AdditionExample() {
  return <ThroughlinePlayer trace={trace} theme="auto" />;
}
```

Compile outside the render function or memoize by source. `trace` is required; do not pass raw `source`, `autoplay`, or `initialStep` props. For Next.js, compile on the server and pass the trace into a client component that renders the player. A Markdown `thl` fence is **not** interactive by itself; MDX sites must explicitly render the player. Read [application integration](references/integration.md) for client boundaries, multi-fence Markdown, styling, and optional sound.

## Avoid invalid diagrams

- Declare every `group`, `node`, and `link` before the first `step`. Use an existing ID in `set`, `focus`, and `send`.
- Use JSON values, not expressions: `set count = 2` is valid; `set count = count + 1` is not.
- `send` depicts movement along a visible link; it **does not** update the destination. Add `set` in a later step to change the destination.
- Declare initially hidden nodes and links up front, then `show` them before a transfer. Never send across a hidden link or endpoint.
- Do not write the same target twice, or both a parent and its child, in one step.
- The `bindings` domain is not a full JavaScript interpreter; `callstack` cannot execute arbitrary recursion.
- Do not pass a whole Markdown document containing multiple `thl` blocks to `compile`; extract and compile each block separately.

Read [flow syntax](references/grammar.md) for layouts, views, paths, and visibility. Read [API and validation](references/api-and-validation.md) for `tracer()`, diagnostics, limits, trace inspection, and tests.

## Start from a complete example

These standalone files are ready to copy and adapt:

- [Custom flow](assets/flow.thl)
- [Reference bindings](assets/bindings.thl)
- [Binary addition](assets/binary.thl)
- [Matrix multiplication](assets/matrix.thl)
- [Factorial call stack](assets/callstack.thl)

Install the runtime in the consuming project with `npm install @0xbuff/throughline`. From that project's root, run the bundled validator against **each** completed diagram:

```sh
node <installed-skill-directory>/scripts/validate.mjs <diagram.thl>
```

The [validator](scripts/validate.mjs) resolves the project's installed runtime, reports the frame count, and fails on invalid diagrams. For visual integrations, also check keyboard navigation, captions, controls, layout, and styles in the browser. State any checks that could not be run rather than implying success.
