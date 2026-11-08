# Public API, compilation contract and test discipline (v0.0.2)

Read this when programmatically producing traces, integrating tooling, debugging errors or writing tests. Check [upstream index](https://github.com/0xbuffdev/throughline/blob/main/src/index.ts), [types](https://github.com/0xbuffdev/throughline/blob/main/src/model.ts) and [architecture](https://github.com/0xbuffdev/throughline/blob/main/docs/architecture.md) when the installed version differs.

## Exact public exports

`@0xbuff/throughline`:
- Functions: `compile`, `compileAst`, `parseThl`, `parseProgram`, `compileProgram`, `validateProgram`, `describeFrame`, `tracer`.
- Values: `SUPPORTED_DOMAINS`, `COMPILATION_LIMITS`, `ProgramError`.
- Types: `DomainName`, `ThlBlock`, `Program`, `Trace`, `Frame`, `Snapshot`, `Entity`, `Relation`, `Beat`, `Event`, `Value`, `View`, `GroupLayout`, `SceneGroup`, `Diagnostic`, `SourceLocation`, `Tracer`, `StepApi`.

`@0xbuff/throughline/react` exports `ThroughlinePlayer` and `ThroughlinePlayerProps`; the React player also exposes type `SonificationOptions` / `SonificationEvent`. `@0xbuff/throughline/examples` exports `EXAMPLES`. CSS is an explicit separate import. No additional public entry points are supported.

## Choosing APIs

- `compile(source: string): Trace` — easiest; accepts one fenced or unfenced `thl <domain>` source.
- `parseThl(source: string): ThlBlock | null` — parse one block and preserve its header/body information.
- `compileAst(ast: ThlBlock): Trace` — use when the host's Markdown parser has already supplied a block. `ThlBlock` has `kind`, `lines` and optional `source: { line }`.
- `parseProgram(ast: ThlBlock): Program` — parse hand-authored flow program; input must be `flow`.
- `validateProgram(program)` — validate program structure.
- `compileProgram(program): Trace` — validate/compile a manually constructed `Program` or `tracer().program()`.
- `tracer(): Tracer` — construct a deterministic program through a synchronous builder.
- `describeFrame(frame, frameCount)` — accessible textual description.
- `ProgramError` — thrown on invalid source/program, with a `diagnostics` array.

## Tracer: programmatic narration, not a hidden interpreter

~~~ts
import { compileProgram, tracer } from "@0xbuff/throughline";

const builder = tracer()
  .node("counter", "Counter", 0, { view: "number" })
  .step("Increment", (step) => {
    step.set("counter", 1);
    step.focus("counter");
    step.note("Counter now holds one.");
  });

const trace = compileProgram(builder.program());
~~~

Use `tracer().group(name, "row" | "column" | "tree")`, `.node(id, label, value, options?)`, `.link(id, from, to, label?, options?)`, `.get(target)`, `.step(label, syncCallback)` and `.program()`. The `StepApi` writer supports `set`, `focus`, `send`, `note`, `show`, `hide`. Step callbacks **must be synchronous**; do not return promises. `get` sees the state after the most recently completed step; it does not read other pending writes from the current step.

Use `tracer` when implementing legitimate algorithm adapters *within* the Throughline source repository. Consumers may also use the published builder API without adding new public domain names.

## Core trace shape

~~~ts
type Trace = {
  version: 1;
  frames: Frame[];
  groups?: SceneGroup[];
};

type Frame = {
  index: number;
  label: string;
  state: {
    entities: Entity[];
    relations: Relation[];
    active: string[];
    changed: string[];
    transfers: { relation: string; value?: Value }[];
    notes: string[];
  };
  events: Event[];
  source?: { line: number };
};
~~~

Each compiled `Trace` begins at frame 0 (initial state), then one frame per step. `frames.length = 1 + program.beats.length`. A `send` appears in `transfers` but cannot update an entity on its own. `show`/`hide` persist into later snapshots; focus, changed and transfers reflect the current beat. Schema `version: 1` does not track the npm version.

## Handling diagnostics without losing context

~~~ts
import { compile, ProgramError } from "@0xbuff/throughline";

function validateTrace(source: string) {
  try {
    return compile(source);
  } catch (error) {
    if (error instanceof ProgramError) {
      for (const diagnostic of error.diagnostics) {
        console.error({
          message: diagnostic.message,
          line: diagnostic.line,
          beat: diagnostic.beat,
        });
      }
    }
    throw error;
  }
}
~~~

Parse and validation errors may contain `line` (relative to supplied content) or `beat`. Do not fabricate line numbers. When building MDX, map source spans to actual document locations through the host parser.

## Bounded semantics

- Max source length **262,144 UTF-16 code units**.
- Max **200 entities**, **1,000 relations**, **2,000 steps**, **10,000 events** per program.
- Program payload work budget **1,000,000** units; expanded trace budget **8,000,000** units.
- Nested values must be finite JSON-like data and cyclic structures are invalid.
- Conflicting writes and illegal/hidden topology transfers fail at compile time.
- Computed domains have tighter input limits; read [domains](domains.md).

These budgets bound deterministic work but are not a hard RAM/CPU time guarantee.

## Minimum acceptance checks

1. Compile every delivered `thl` block using the *actual installed package version*. Run tests before claiming they pass.
2. Assert `trace.version === 1` and that there is exactly one initial frame plus one per intended step.
3. Assert at least one important intermediate and final entity value, including array/object paths where relevant.
4. Assert a transfer appears only on the intended beat and that it did not mutate its destination absent a `set`.
5. Assert hidden items are absent until shown, and that focus/changed annotations correspond to the narrative.
6. Test one failure for each new authoring feature (bad reference, overlapping writes, malformed JSON, invalid computed-domain parameter).
7. For React/MDX work, test SSR/hydration, stylesheet presence, keyboard stepping, theme and accessible captions; inspect in a browser.
8. Preserve clear errors; never claim the preview or build succeeded unless it ran.

A direct Node smoke test with `node:assert/strict`:

~~~js
import assert from "node:assert/strict";
import { compile } from "@0xbuff/throughline";

const source = [
  "```thl flow",
  'node count "Count" = 0',
  'step "Increase"',
  '  set count = 1',
  "```",
].join("\n");

const result = compile(source);
assert.equal(result.version, 1);
assert.equal(result.frames.length, 2);
assert.equal(result.frames[1].state.entities.find(e => e.id === "count")?.value, 1);
~~~

When changing the *Throughline package* itself, follow its [AGENTS.md](https://github.com/0xbuffdev/throughline/blob/main/AGENTS.md) and full package CI/audit requirements. Those are separate from using this published consumer skill.
