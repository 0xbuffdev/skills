# Hand-authored `thl flow` grammar and semantics (v0.0.2)

Use this file when writing or reviewing authored flow traces. It summarizes the released [grammar](https://github.com/0xbuffdev/throughline/blob/main/docs/grammar.md); the package parser is authoritative.

## Parsing scope

One source passed to `compile` begins with a `thl <domain>` header or a CommonMark-compatible ```thl flow` / `~~~thl flow` fence. End it before unrelated Markdown. Surrounding prose and multi-block documents must be split by the host parser. Fences support CommonMark-style indentation and length; the header accepts **only** `thl` plus one domain token. Blank and `#` comment lines inside the block are ignored.

## Declarations before any step

| Syntax | Effect |
| --- | --- |
| `group "<name>" as row\|column\|tree` | Layout for matching named lane/group |
| `node <id> "<label>" [in "<lane>"] [as <view>] [hidden] [= <json>]` | Entity; missing initial value defaults to `null` |
| `link <id> <from> -> <to> ["<label>"] [hidden]` | Directed relation between declared node identifiers |
| `step "<label>"` | Start a named beat; all following events attach to it until next `step` |

Layouts: `row`, `column`, `tree`. Node views: `auto`, `text`, `number`, `array`, `stack`, `matrix`, `bits`, `record`. Identifier tokens consist of word characters and hyphens. Quote user-visible labels and lane names as JSON strings. Entities/relations and groups cannot be added after the first step.

## Events inside a named step

| Syntax | Effect |
| --- | --- |
| `set <target> = <json>` | Persistently update an entity value or nested position |
| `focus [<target>, ...]` | Highlight targets *for this beat only*; comma or whitespace separated |
| `send <link-id> [= <json>]` | Emit a one-beat transfer along an existing, visible link; **not** a write |
| `note "<text>"` | Add a one-beat caption |
| `show node <id>` / `hide node <id>` | Persistently change node visibility |
| `show link <id>` / `hide link <id>` | Persistently change relation visibility |

No events may precede the first step. State updates in one step are applied together. A same-step transfer is validated against the resulting visibility state.

## Targets, JSON, values

Valid targets: `counter`, `items[0]`, `matrix[1][2]`, `settings.mode`. Use a known node ID. `set` validates actual paths; records may gain keys and arrays may append at exactly `[length]`, but no arbitrary sparse insertion or indexing into non-arrays. `focus` validates target syntax and ID; an unresolved *position* may not visibly highlight, so use real values and verify.

Allowed literal values are finite JSON (`null`, booleans, numbers, quoted strings, arrays, objects). No `undefined`, `NaN`, `Infinity`, comments inside JSON, or JavaScript expressions. The language has no assignments based on arithmetic expressions; compute values externally when authoring steps.

A step may not contain overlapping writes to the same target or an ancestor/descendant path. Split these into separate steps. Relations must point to known node IDs; transfers cannot use hidden links or endpoints.

## Full explanatory example

~~~markdown
```thl flow
group "Pipeline" as row
node input "Input" in "Pipeline" as number = 3
node output "Output" in "Pipeline" as number = 0
node archive "Archive" in "Pipeline" hidden = null
link channel input -> output "signal"
link archived output -> archive hidden
step "Read"
  focus input
  note "Input currently holds three."
step "Transmit"
  send channel = 3
  focus input, output
  note "The transfer is shown, but output still holds zero."
step "Receive"
  set output = 3
  focus output
  note "Receiving is modeled by an explicit state update."
step "Archive"
  show node archive
  show link archived
  set archive = 3
  focus archive
  note "The archived value now appears."
```
~~~

The example starts with three entities (one hidden) and two links (one hidden). `Transmit` sends a packet without changing `output`; `Receive` applies the write; `Archive` reveals predeclared topology and state. Verify the final snapshots rather than inferring them from captions alone.

## Staging rules

1. **One idea per beat.** Keep independent operations separate so captions/highlights remain legible.
2. **Sending is not setting.** If depicting a transfer and an arrival as two stages, use `send` in the first and `set` in the next. If both genuinely belong to one atomic step, both events may appear there.
3. **Stable identities.** Declare future entities and links as hidden and show/hide them to depict structural changes; never try to declare a node inside a step.
4. **Explain actual state.** A note claiming an update is not evidence of a `set`; check the resulting frame.
5. **Avoid brittle same-value transitions.** Calling `set x = 1` when `x` is already `1` may not produce an apparent change; the beat can still focus and explain.

## Failure conditions to check

- Misspelled domain or header, extra header options, malformed fence.
- Missing/duplicate identifiers, unsupported view/layout, invalid JSON.
- Events before a step, declarations after a step.
- Unknown link/entity or impossible nested target.
- Same-step parent/child conflicting writes.
- Transferring on hidden topology.
- Source or expansion limits exceeded.

`ProgramError.diagnostics` contains `message` and optionally `line` or `beat`. Do not swallow diagnostics.
