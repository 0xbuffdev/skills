# Use Throughline in an application

These examples use `@0xbuff/throughline` version `0.0.2`.

## Install

For a Node.js 24+ TypeScript or JavaScript project:

~~~sh
npm install @0xbuff/throughline
~~~

For an interactive React player, also use React 19 and React DOM 19:

~~~sh
npm install react@^19 react-dom@^19
~~~

The core compiler works without React or a browser.

## Supported imports

| Import | What it provides |
| --- | --- |
| `@0xbuff/throughline` | Compile diagrams and inspect frames |
| `@0xbuff/throughline/react` | `ThroughlinePlayer` |
| `@0xbuff/throughline/examples` | Ready-made `EXAMPLES` |
| `@0xbuff/throughline/styles/throughline.css` | The player stylesheet |

Do not import from internal `src` or `dist` paths.

## Compile without React

~~~ts
import { compile } from "@0xbuff/throughline";

const source = [
  "```thl flow",
  'node task "Task" = "pending"',
  'step "Complete"',
  '  set task = "done"',
  "  focus task",
  '  note "The task is complete."',
  "```",
].join("\n");

const trace = compile(source);

console.log(trace.version);       // 1
console.log(trace.frames.length); // 2
~~~

`compile` turns one `thl` block into frames: the initial frame followed by a frame for every step. The trace schema version `1` is separate from the npm package version.

## Display an interactive React player

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

const trace = compile(source);

export function AdditionDemo() {
  return <ThroughlinePlayer trace={trace} theme="auto" />;
}
~~~

Import the stylesheet only once in the application. Keep the compiled `trace` stable while the user steps through it; if you give the player a newly created trace object, playback resets.

The player accepts these props:

| Prop | Type | Description |
| --- | --- | --- |
| `trace` | `Trace` | Required compiled diagram |
| `theme` | `"auto" \| "light" \| "dark"` | Color theme; defaults to `"auto"` |
| `className` | `string` | A custom class for styling |
| `sonification` | `SonificationOptions` | Optional sound controls |

Do not pass raw `source`, `autoplay`, `initialStep`, or `children` to the player. The player supplies its own buttons, timeline, state inspector, captions, and keyboard navigation.

### Optional sound

Sound is off unless explicitly provided. To show a sound toggle that starts off:

~~~tsx
<ThroughlinePlayer trace={trace} sonification={{ enabled: false }} />
~~~

`sonification` also supports `onTone` to handle tone events yourself. Its event carries `step`, `total`, `frequency`, and `durationMs`. Avoid starting sound automatically; let the user opt in.

## Next.js and other server-rendered React apps

Use a client component for the player because it uses React hooks. You can compile the source on the server and pass the resulting `Trace` to that component.

~~~tsx
// components/throughline-client.tsx
"use client";

import type { Trace } from "@0xbuff/throughline";
import { ThroughlinePlayer } from "@0xbuff/throughline/react";

export function ThroughlineClient({ trace }: { trace: Trace }) {
  return <ThroughlinePlayer trace={trace} theme="auto" />;
}
~~~

~~~tsx
// app/example/page.tsx — server component
import { compile } from "@0xbuff/throughline";
import { ThroughlineClient } from "@/components/throughline-client";

const source = ["```thl callstack", "fact 4", "```"].join("\n");
const trace = compile(source);

export default function Page() {
  return <ThroughlineClient trace={trace} />;
}
~~~

Load `@0xbuff/throughline/styles/throughline.css` in the application's root layout or another suitable global stylesheet entry. Server compilation keeps the diagram source and parsing work out of the interactive player.

## Markdown, MDX, and Fumadocs

A code block with a `thl` language name is **not automatically interactive**. Syntax highlighting can display the code, but the application must also render a player.

For a single example, create a component that renders both its code and its compiled trace. With a client component like `ThroughlineClient` above:

~~~tsx
// components/lesson-example.tsx — server component
import { compile } from "@0xbuff/throughline";
import { ThroughlineClient } from "./throughline-client";

const source = [
  "```thl flow",
  'node flag "Flag" = false',
  'step "Enable"',
  "  set flag = true",
  "```",
].join("\n");

const trace = compile(source);

export function LessonExample() {
  return (
    <section>
      <pre><code>{source}</code></pre>
      <ThroughlineClient trace={trace} />
    </section>
  );
}
~~~

Use `<LessonExample />` from an MDX page after registering or importing the component as required by the site's MDX setup. This is the simplest dependable way to put a visualization beside the source.

For **every `thl` fence in a Markdown document**, add a build-time Markdown/MDX rule that:

1. Finds fenced code blocks whose language is `thl` and whose domain is one of the five supported names.
2. Takes the contents of each block and builds a complete `thl <domain>` source for it.
3. Compiles each block separately. Show `ProgramError` with its source line when a block is invalid; fail the documentation build rather than silently skipping it.
4. Renders the original code as text and the compiled `Trace` using a client player component.
5. Keeps existing code blocks for other languages unchanged.

Use the site's actual MDX parser/plugin interface; not all versions of Fumadocs pass fence metadata to the same component. Do not assume that changing a `pre` or `code` renderer alone is sufficient.

## Change colors and styles

The default stylesheet uses classes beginning with `thl-` and CSS variables beginning with `--thl-`. Override those variables on a player using `className`:

~~~tsx
<ThroughlinePlayer trace={trace} className="lesson-trace" theme="light" />
~~~

~~~css
/* Load this after the Throughline stylesheet. */
.lesson-trace {
  --thl-bg: #f8fafc;
  --thl-panel: #eef2ff;
  --thl-surface: #ffffff;
  --thl-text: #172033;
  --thl-muted: #4b5563;
  --thl-line: #cbd5e1;
  --thl-focus: #2563eb;
  --thl-focus-bg: #dbeafe;
  --thl-change: #a16207;
  --thl-change-bg: #fef3c7;
  border-radius: 12px;
}
~~~

All supported color variables:

| Variable | Controls |
| --- | --- |
| `--thl-bg` | Player background |
| `--thl-panel` | Group panels and controls |
| `--thl-surface` | Node backgrounds |
| `--thl-text` | Main text |
| `--thl-muted` | Secondary labels and lines |
| `--thl-line` | Borders and separators |
| `--thl-focus` | Active item outlines and transfers |
| `--thl-focus-bg` | Active item backgrounds |
| `--thl-change` | Changed values and outlines |
| `--thl-change-bg` | Changed value backgrounds |

The stylesheet also supplies `.thl-scene`, `.thl-node`, `.thl-caption`, `.thl-controls`, `.thl-timeline`, and `.thl-inspector` selectors. You can override these in a host stylesheet loaded later, for example:

~~~css
.lesson-trace .thl-caption {
  padding: 18px;
}

.lesson-trace .thl-controls {
  gap: 10px;
}
~~~

When replacing styles entirely, preserve the player's layout, focus outlines, keyboard controls, live status, hidden screen-reader descriptions, and reduced-motion support. Using the packaged CSS plus overrides is safer than rewriting it from scratch.

## Common integration mistakes

- Compiling on every React render creates a new trace and resets playback. Compile once or memoize by source.
- Passing an entire Markdown page to `compile` fails. Extract each `thl` block first.
- Forgetting the stylesheet produces a poorly formatted player.
- Importing the React player in a server component may fail; use a client wrapper.
- A Markdown code fence alone is only visible source; add the explicit player component.
- Build errors should show the invalid line instead of displaying a blank visualization.
