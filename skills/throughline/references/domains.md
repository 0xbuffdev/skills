# Built-in diagram types

Throughline supports five diagram types: `flow`, `bindings`, `binary`, `matrix`, and `callstack`. Use [flow diagrams](grammar.md) for anything that does not match the four specialized types below.

Each example is a complete Markdown block. Pass **one block at a time** to `compile(source)`.

## Variables and shared objects: `bindings`

~~~markdown
```thl bindings
let list = [1, 2]
let alias = list
alias.push(3)
alias = [7]
```
~~~

The player shows variable slots and the objects they point to. `alias` first shares the array with `list`. Pushing `3` changes the shared array; reassigning `alias` makes it point to a different array.

Supported commands:

~~~text
let name = 5
const items = [1,2]
let other = items
other = [3]
other.push(4)
~~~

- Each nonempty source line makes one step.
- You can declare with `let` or `const`, assign JSON values or another variable's value, and call `push(...)` on arrays.
- Arrays and objects are shared by reference; primitive values are copied.
- This is a simple learning model, **not a JavaScript interpreter**. In particular, it does not enforce `const` reassignment rules.
- Arithmetic expressions, indexing, property access, `pop`, other methods, and general JavaScript statements are not supported.

## Binary addition: `binary`

~~~markdown
```thl binary
a = 1011
b = 0110
```
~~~

Shows the carry moving through the bits. For this example, 1011 + 0110 = 10001.

- Write exactly `a = <bits>` and `b = <bits>`, in either order.
- Each operand must be an unsigned binary number of 1–16 digits.
- Steps run from the rightmost bit to the left, followed by a `Result` step.
- The result has one extra bit for carry-out, even when the extra bit is zero.
- Signed numbers, subtraction, multiplication, and other bitwise operations are not supported.

## Matrix multiplication: `matrix`

~~~markdown
```thl matrix
A = [[1,2],[3,4]]
B = [[5,6],[7,8]]
```
~~~

Displays the input row and column used to calculate each output cell. The result here is `[[19,22],[43,50]]`.

- Write exactly `A = <matrix>` and `B = <matrix>`, in either order.
- Matrices are rectangular JSON arrays with finite numeric values.
- Each matrix has 1–4 rows and 1–4 columns; the number of columns in `A` must equal the number of rows in `B`.
- Each output cell gets one step, in row-by-row order.
- Matrix inversion, transpose, and determinant are not supported.

## Factorial calls: `callstack`

~~~markdown
```thl callstack
fact 4
```
~~~

Shows calls to `fact(4)` down to `fact(1)`, then each return, and finally the result `24`.

- Write exactly one line: `fact <n>`.
- `n` must be an integer from `1` to `6`.
- The diagram shows how recursive calls build and unwind the stack.
- The total number of steps is `2 × n + 1` (and one additional initial frame).
- This mode cannot run Fibonacci, user-defined functions, loops, or general recursion. For those explanations, write a `flow` diagram.

## Choose correctly

| What the user needs | Use |
| --- | --- |
| A step-by-step custom algorithm, network exchange, sort, search, or workflow | `flow` |
| Array aliases and references | `bindings` |
| Unsigned addition with carries | `binary` |
| Small matrix products | `matrix` |
| Factorial function call stack | `callstack` |

Do not label an example `thl sort`, `thl search`, `thl tcp`, or any other name that is not in this list. Those blocks will not compile.
