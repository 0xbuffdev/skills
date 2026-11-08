# Integrating Throughline in TypeScript, React 19 and Markdown/MDX

Use the package's **four documented exports only**:

| Export | Use |
| --- | --- |
| `@0xbuff/throughline` | React-free compiler, parser, tracer, types and diagnostics |
| `@0xbuff/throughline/react` | Optional `ThroughlinePlayer` and its props |
| `@0xbuff/throughline/examples` | Shipped `EXAMPLES` authored fixture list |
| `@0xbuff/throughline/styles/throughline.css` | Explicit opt-in player stylesheet |

The 0.0.2 package is ESM, targets Node.js **24+**, and has optional React / React DOM **19** peers. Do **not** deep-import `src/*` or `dist/*`. The compiler itself must not load React.

## Install only what you need

~~~sh
npm install @0xbuff/throughline
~~~

Only for the React player:

~~~sh
npm install react@^19 react-dom@^19
~~~

Do not install the React player if the task is headless trace compilation or validation.

## Pure compilation: Node, scripts, CI, static publishing

~~~ts
import { compile, ProgramError } from "@0xbuff/throughline";

const source = [
  "```thl flow",
  'node state "State" = "idle"',
  'step "Activate"',
  '  set state = "active"',
  "  focus state",
  '  note "The state is active."',
  "```",
].join("\n");

let trace;
try {
  trace = compile(source);
} catch (error) {
  if (error instanceof ProgramError) {
    // Preserve source-positioned diagnostics and the original error.
    console.error(error.diagnostics);
  }
  throw error;
}

// Initial frame, then one frame per named step.
console.log(trace.frames[0]?.label, trace.frames[1]?.state.entities);
~~~

**Scope:** `compile(source)` parses **one** `thl` block, not a whole Markdown page. Header can be fenced or unfenced. For a parsed document, have the host Markdown/MDX parser identify blocks, then compile each block separately. `parseThl` returns an AST or `null`; `compileAst(ast)` compiles an already-extracted `ThlBlock`.

## React player

Import CSS **once** from your app's global stylesheet entry or root layout. In a regular React app:

~~~tsx
import { compile } from "@0xbuff/throughline";
import { ThroughlinePlayer } from "@0xbuff/throughline/react";
import "@0xbuff/throughline/styles/throughline.css";

const source = [
  "```thl binary",
  "a = 1011",
  "b = 0110",
  "```",
].join("\n");

const stableTrace = compile(source); // Outside component: do not recompile each render.

export function BinaryDemo() {
  return <ThroughlinePlayer trace={stableTrace} theme="auto" />;
}
~~~

Actual player props (0.0.2): `trace: Trace` (required), `className?: string`, `theme?: "light" | "dark" | "auto"`, `sonification?: SonificationOptions`. Do not pass `source`, `initialStep`, `autoPlay`, `events`, `children` or an invented callback. Sound controls are omitted unless `sonification` is explicitly supplied; never enable audio on behalf of a user implicitly.

The player renders a responsive SVG and caption/inspector/controls. Keyboard navigation, status announcements, reduced motion and resizing are built in; retain them when wrapping. The `--thl-*` CSS custom properties and `thl-` classes govern theming; put host overrides after the package stylesheet and optionally supply a scoping `className`. Do not copy undocumented internal CSS or replace package components to add simple theming.

## Next.js App Router / React Server Components

The player uses React hooks. Put the player wrapper in a client component; compile on the server or at build time when possible. The compiled `Trace` is serializable data that can be passed to the client boundary.

~~~tsx
// components/trace-player.tsx
"use client";

import type { Trace } from "@0xbuff/throughline";
import { ThroughlinePlayer } from "@0xbuff/throughline/react";

export function TracePlayer({ trace }: { trace: Trace }) {
  return <ThroughlinePlayer trace={trace} theme="auto" />;
}
~~~

~~~tsx
// app/example/page.tsx (server component)
import { compile } from "@0xbuff/throughline";
import { TracePlayer } from "@/components/trace-player";

const source = ["```thl callstack", "fact 4", "```"].join("\n");

export default function ExamplePage() {
  return <TracePlayer trace={compile(source)} />;
}
~~~

Import `@0xbuff/throughline/styles/throughline.css` once in the app's global CSS entry (for example the root layout). Keep compilation at module/build/server scope for static lessons or memoized for changing inputs. Avoid client-side recompilation on playback events; replacing the `trace` object resets playback. Ensure the framework's Node and React versions actually meet the published requirements.

## MDX and Fumadocs: code fence + live visualization

A Markdown fence such as:

~~~markdown
```thl matrix
A = [[1,2],[3,4]]
B = [[5,6],[7,8]]
```
~~~

is **just code** to most Markdown/MDX renderers. Installing Throughline or adding the language name to syntax highlighting does not make a player appear. To present both source and a live player:

1. Use the existing Markdown/MDX parser (including Fumadocs' configured MDX pipeline) to identify fenced code whose information string is `thl <supported-domain>`. Preserve its body, language metadata and source locations.
2. For each matching block, construct a *single* Throughline source (`header + newline + body`, or a complete fenced block) and call `compile` / `compileAst` at build time or in a trusted server compilation phase.
3. On `ProgramError`, surface the original diagnostics at authoring/build time. Do **not** silently drop malformed traces, and do not swallow errors with an empty player.
4. Render the original, escaped source as a normal syntax-highlighted code block **and** a component that receives the compiled `Trace` as data and renders `<ThroughlinePlayer trace={trace} />` (through a client wrapper where necessary).
5. Confirm the stylesheet loads once, the player hydrates without mismatch and accessible controls work. Preserve existing MDX component mappings and don't inject unsanitized HTML.

The exact remark/rehype/MDX component override API depends on the host's installed Fumadocs and MDX versions. Read its actual configuration and official documentation before implementing a transformer. Never assume a `pre` renderer is given a `thl` info string or that a `code` renderer automatically knows the fence metadata. If the host's pipeline cannot recover it, use an explicit authored demo component instead.

## Safe architecture for authoring systems

- The authored block is *data*, not executable JavaScript; compile does not evaluate arbitrary authored code or fetch URLs.
- Source parsing is bounded, and invalid references/cycles/values are rejected. Still apply your application's input-size, authorization and content-review policies.
- For many blocks, compile each independently; do not concatenate them or assume a block can reference nodes in another.
- Display text/diagnostics as text, not raw HTML. Do not expose private paths or build secrets in public error pages.
- In a docs build, fail CI on invalid Throughline input so misleading visualizations cannot ship.
- On runtime user-authored content, use a controlled error view and cap request/work budgets; never treat compile errors as a reason to execute the source another way.
