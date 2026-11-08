# Computed domains — exact supported syntax (v0.0.2)

Choose a computed adapter only when the user's explanation matches its *implemented* language. They produce regular version-1 trace frames. Use `flow` for custom workflows, branches, loops, sorting/search algorithms, protocols or math beyond the listed adapters.

## `bindings` — primitives, references and push

~~~markdown
```thl bindings
let a = 5
let b = a
b = 9
const list = [1, 2]
const alias = list
alias.push(3)
alias = [7]
```
~~~

Supported statements: `let` or `const` declaration (`<name> = <json-or-name>`), variable reassignment (`<name> = <json-or-name>`), and `<name>.push(<json>, ...)` on arrays. One source line = one beat. Variables occupy Stack slots; array/object literals appear as heap objects, and reference edges identify aliases. Object identities persist while bindings change. *Important:* `const` immutability is **not enforced** in this educational domain. It is not a JS interpreter. No arithmetic expressions, property reads, indexes, `pop`, or other methods. If exact JavaScript `const` errors are the lesson, manually narrate with `flow` or explain the simplified model.

## `binary` — unsigned ripple-carry addition

~~~markdown
```thl binary
a = 1011
b = 0110
```
~~~

Two binary operands `a` and `b` in either order, each 1–16 bits. One beat per bit from least significant to most significant, then `Result`. The result is width `n+1` (including leading carry-out zero if no carry). No subtraction, signed two's-complement, multiplication or arbitrary bitwise operations.

## `matrix` — small matrix multiplication

~~~markdown
```thl matrix
A = [[1,2],[3,4]]
B = [[5,6],[7,8]]
```
~~~

Two JSON 2D matrices (`A` and `B`) in either order: each with 1–4 rows and 1–4 columns; finite numeric cells; rectangular rows; dimensions compatible (`A` columns = `B` rows). One beat per output cell in row-major order. It focuses the input row/column, writes the corresponding result cell, shows terms and transfers. Result for this example is `[[19,22],[43,50]]`. No determinant, transpose or inverse.

## `callstack` — factorial recursion, only

~~~markdown
```thl callstack
fact 4
```
~~~

One instruction `fact <n>`, integer depth 1–6 inclusive. Shows calls down to `fact(1)`, returns up the call stack, then a final result. Up to 13 beats. This does **not** support Fibonacci, arbitrary functions or general stack-machine execution.

## Domain selection quick check

| User wants | Domain | Why |
| --- | --- | --- |
| Custom workflow, algorithm steps, network request or CI | `flow` | Hand-authored state and relations |
| Aliasing, rebinding, array push | `bindings` | Simplified reference model |
| Carry propagation for binary addition | `binary` | Exact dedicated adapter |
| Row-by-column matrix product | `matrix` | Exact dedicated adapter |
| Call/return for `fact(n)` | `callstack` | Bounded factorial only |
| Bubble sort, DFS, TCP, gradients, real JS interpreter | `flow` | No matching released adapter |

Never advertise planned `search`, `sort`, `vectors`, `gradient`, `cache`, `race` or `tcp` as supported domains in 0.0.2. Read the [upstream catalog](https://github.com/0xbuffdev/throughline/blob/main/docs/catalog.md) for adapter-specific emitted beats and current limits.

## Validation

Every example is *one* input block passed to `compile`. Require a nonempty trace, compare the final values with expected arithmetic or mutation, and check labels/frame counts where promised. On invalid parameters, surface `ProgramError` and its original diagnostics instead of substituting a different domain without telling the user.
