# Throughline API and fixing errors

These interfaces describe `@0xbuff/throughline` version `0.0.2`. Use them to write correct code and confirm the result.

## Functions and imports

From `@0xbuff/throughline`:

| API | Use |
| --- | --- |
| `compile(source)` | Turn one `thl` block into a `Trace` |
| `parseThl(source)` | Read a block; returns its contents or `null` |
| `compileAst(block)` | Compile a previously read block |
| `parseProgram(block)` | Read the commands from a `flow` block into a `Program` |
| `validateProgram(program)` | Check a program without rendering it |
| `compileProgram(program)` | Make frames from a program |
| `tracer()` | Build a program directly in TypeScript |
| `describeFrame(frame, count)` | Get a readable description of a frame |
| `SUPPORTED_DOMAINS` | The five supported names |
| `COMPILATION_LIMITS` | Maximum sizes and work limits |
| `ProgramError` | Error type for invalid diagrams |

The root import also exports types: `ThlBlock`, `DomainName`, `Trace`, `Program`, `Frame`, `Snapshot`, `Entity`, `Relation`, `Beat`, `Event`, `Value`, `View`, `GroupLayout`, `SceneGroup`, `Diagnostic`, `SourceLocation`, `Tracer`, and `StepApi`.

From `@0xbuff/throughline/react`: `ThroughlinePlayer` and types `ThroughlinePlayerProps`, `SonificationOptions`, and `SonificationEvent`.

From `@0xbuff/throughline/examples`: `EXAMPLES`, a collection of ready-made diagrams.

## What a compiled diagram contains

A `Trace` has a schema `version` of `1` and an array of `frames`. Frame `0` is the initial state. Every named step adds one more frame:

~~~ts
type Trace = {
  version: 1;
  frames: Frame[];
  groups?: SceneGroup[];
};
~~~

A frame includes its `index`, `label`, current `state`, `events`, and sometimes a source line. The state contains:

- `entities`: current nodes and their values.
- `relations`: current links.
- `active`: highlighted targets for this frame.
- `changed`: targets written in this frame.
- `transfers`: messages shown moving along links.
- `notes`: captions for this step.

Checking `state.entities` is the best way to confirm that a diagram actually shows the values you intended. A caption or transfer does not prove a value changed.

## Build a diagram from TypeScript

`tracer()` is useful when the steps are calculated in code and you want to record what happens.

~~~ts
import { compileProgram, tracer } from "@0xbuff/throughline";

const t = tracer()
  .node("counter", "Counter", 0, { view: "number" })
  .step("Increase", step => {
    step.set("counter", 1);
    step.focus("counter");
    step.note("The counter becomes one.");
  });

const trace = compileProgram(t.program());
~~~

Supported builder methods:

- `group(name, "row" | "column" | "tree")`
- `node(id, label, value, { lane?, view?, hidden? })`
- `link(id, from, to, label?, { hidden? })`
- `get(target)` — current value after the last completed step.
- `step(label, callback)` — record one step using `set`, `focus`, `send`, `note`, `show`, or `hide`.
- `program()` — return the assembled program for `compileProgram`.

Callbacks in `step` must be **synchronous**; do not use `async` or return a promise. Changes made within a step take effect together. Call `get` between steps to read completed state.

## Show useful errors

~~~ts
import { compile, ProgramError } from "@0xbuff/throughline";

function compileLesson(source: string) {
  try {
    return compile(source);
  } catch (error) {
    if (error instanceof ProgramError) {
      for (const problem of error.diagnostics) {
        console.error(problem.line, problem.beat, problem.message);
      }
    }
    throw error;
  }
}
~~~

`ProgramError.diagnostics` contains a `message` and may also contain a `line` or `beat`. Only show a line number when one exists. For a Markdown page, preserve the block's original position so the author can fix the right line.

Common causes of errors:

| Problem | Fix |
| --- | --- |
| Unknown domain name | Use `flow`, `bindings`, `binary`, `matrix`, or `callstack` |
| Invalid value | Write valid finite JSON; quote strings |
| Unknown item or link | Declare it before the first step and use the correct ID |
| Incorrect path like `items[10]` | Update an existing position or append at the array's current length |
| Two writes to the same item in one step | Split the writes into separate steps |
| Sending along a hidden link | Show the link and its endpoints before the transfer |
| Extra prose or multiple blocks passed to `compile` | Compile one block at a time |
| Unsupported computed-domain instruction | Use its documented instructions or switch to `flow` |

## Limits

Throughline rejects inputs that are too large. In version `0.0.2`:

- Source: at most **262,144 UTF-16 code units**.
- One program: at most **200 nodes**, **1,000 links**, **2,000 steps**, and **10,000 recorded commands**.
- Program value/work allowance: **1,000,000** units.
- Expanded trace allowance: **8,000,000** units.

These are limits on the work the compiler performs, not guaranteed CPU time or memory usage. The built-in diagram types have additional smaller limits described in [other diagram types](domains.md).

## Check a finished diagram

Use assertions or inspect the compiled frames:

~~~ts
import { compile } from "@0xbuff/throughline";

const source = [
  "```thl flow",
  'node count "Count" = 0',
  'step "Increase"',
  "  set count = 1",
  "```",
].join("\n");

const trace = compile(source);
if (trace.version !== 1) throw new Error("Unexpected trace format");
if (trace.frames.length !== 2) throw new Error("Expected initial and changed frames");
if (trace.frames[1].state.entities.find(e => e.id === "count")?.value !== 1) {
  throw new Error("The count did not change");
}
~~~

For diagrams with links, check that `send` appears only in the intended step and that it does not change values without `set`. For hidden objects, check that they appear at the right step. For React, test that playback, styles, keyboard navigation, and captions work.

Compilation reads structured data; it does not execute authored JavaScript, load remote resources, or run a program the user pasted. Never execute authored content as a workaround for a compilation error.
