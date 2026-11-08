# Custom diagrams with `thl flow`

Use `flow` when you want to choose exactly what appears and what changes during each step. It works for algorithms, data structures, system behavior, workflows, and lessons.

## How a flow diagram is written

Put one `thl flow` block in Markdown:

~~~markdown
```thl flow
node counter "Counter" = 0
step "Increase"
  set counter = 1
  focus counter
  note "The counter is now one."
```
~~~

Everything before the first `step` sets up the diagram. Each `step` shows one change or explanation. Empty lines and lines beginning with `#` may be used for readability.

You may pass a single full fence to `compile(source)`, or start the string with `thl flow` without Markdown fences. Do not pass an entire Markdown document containing surrounding prose or multiple blocks.

## Set up the diagram

| Statement | Example | What it does |
| --- | --- | --- |
| `group "<name>" as row\|column\|tree` | `group "Memory" as row` | Choose how items in a named lane are arranged. |
| `node <id> "<label>" [in "<lane>"] [as <view>] [hidden] [= <json>]` | `node items "Items" in "Memory" as array = [1,2]` | Add an item with an initial value. |
| `link <id> <from> -> <to> ["<label>"] [hidden]` | `link route input -> output "sends"` | Connect two items with a directed link. |
| `step "<label>"` | `step "Receive"` | Start a step. The following commands belong to it. |

Use a unique ID for each node and link. IDs may contain letters, digits, underscores, and hyphens. Labels, lane names, step names, and link labels are double-quoted strings.

- Layouts: `row`, `column`, `tree`.
- Views: `auto`, `text`, `number`, `array`, `stack`, `matrix`, `bits`, `record`.
- If no initial value is given, a node starts at `null`.
- The lane name in `in "<lane>"` is also the name used to arrange nodes with `group`.
- Declare groups, nodes, and links before the first `step`.

## Commands inside a step

| Command | Example | Meaning |
| --- | --- | --- |
| `set <target> = <json>` | `set counter = 2` | Change a value for this step and future steps. |
| `focus <target>, <target>` | `focus input, output` | Highlight one or more items during this step. |
| `send <link-id> [= <json>]` | `send route = 2` | Show data moving along a link for this step only. |
| `note "<text>"` | `note "The response arrived."` | Add a caption for this step. |
| `show node <id>` / `hide node <id>` | `show node output` | Reveal or hide a node until changed again. |
| `show link <id>` / `hide link <id>` | `show link route` | Reveal or hide a link until changed again. |

**Sending is not changing a value.** `send route = 2` shows a transfer but does not update the destination; add a separate `set` when you want its state to change.

`focus`, `note`, and `send` describe one step. `set`, `show`, and `hide` affect later frames too.

## Values and targets

A value must be JSON: numbers, booleans, `null`, double-quoted strings, arrays, or objects.

Valid:

~~~text
set count = 3
set mode = "running"
set ready = true
set items = [1,2,3]
set settings = {"enabled":true}
set items[1] = 9
set settings.enabled = false
set grid[0][1] = 8
~~~

Unsupported:

~~~text
set count = count + 1
set mode = running
set count = undefined
set items[10] = 5
~~~

Every target starts with an existing node ID. You may update an array position or an object property if the path makes sense. You can append one item at an array's current length, but you cannot skip array positions. You cannot write a parent and its child in the same step (for example, `set items = [1,2]` and `set items[0] = 3`). Use separate steps instead.

A `focus` target can refer to a whole node or a position inside it; use an actual position when you need a visible highlight.

## Full example: send, receive, then finish

~~~markdown
```thl flow
group "Request" as row
node client "Client" in "Request" as text = "ready"
node server "Server" in "Request" as text hidden = null
link request client -> server "message" hidden
step "Start"
  focus client
  note "The client is ready to send."
step "Open connection"
  show node server
  show link request
  note "The destination is available."
step "Send request"
  send request = "hello"
  focus client
  note "The message is in transit. The server has not changed yet."
step "Receive request"
  set server = "hello"
  focus server
  note "The server now holds the message."
```
~~~

After `Send request`, the server's value is still `null`. Only `Receive request` changes it to `"hello"`. The client, server, and link are declared once and keep their identities through every step.

## Before finishing

- Keep each step short enough to explain in a sentence.
- Check all IDs and links before running the compiler.
- Ensure the link and its two nodes are visible when using `send`.
- If a value already equals the value written by `set`, there may be no visual change highlight. Use a meaningful `focus` or adjust the steps.
- Invalid syntax, references, value paths, conflicting changes, and hidden transfers cause `ProgramError`. Fix the source and compile again.
