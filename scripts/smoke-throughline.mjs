import assert from "node:assert/strict";
import { compile, compileProgram, ProgramError, tracer } from "@0xbuff/throughline";

const traces = [
  {
    name: "flow",
    source: [
      "```thl flow",
      'node a "A" = 3',
      'node b "B" = 0',
      'link ab a -> b',
      'step "Transfer"',
      "  send ab = 3",
      'step "Receive"',
      "  set b = 3",
      "```",
    ].join("\n"),
    expectedFrames: 3,
  },
  {
    name: "bindings",
    source: ["```thl bindings", "let a = [1]", "let b = a", "b.push(2)", "```"].join("\n"),
    expectedFrames: 4,
  },
  {
    name: "binary",
    source: ["```thl binary", "a = 1011", "b = 0110", "```"].join("\n"),
    expectedFrames: 6,
  },
  {
    name: "matrix",
    source: ["```thl matrix", "A = [[1,2],[3,4]]", "B = [[5,6],[7,8]]", "```"].join("\n"),
    expectedFrames: 5,
  },
  {
    name: "callstack",
    source: ["```thl callstack", "fact 4", "```"].join("\n"),
    expectedFrames: 10,
  },
];

for (const test of traces) {
  const trace = compile(test.source);
  assert.equal(trace.version, 1, test.name);
  assert.equal(trace.frames.length, test.expectedFrames, test.name);
}

const flow = compile(traces[0].source);
const initial = flow.frames[0].state;
const transferred = flow.frames[1].state;
const received = flow.frames[2].state;
const value = (state, id) => state.entities.find(entity => entity.id === id)?.value;
assert.equal(value(initial, "b"), 0);
assert.equal(value(transferred, "b"), 0, "send must not change the target");
assert.equal(transferred.transfers.length, 1);
assert.equal(value(received, "b"), 3);

const program = tracer()
  .node("count", "Count", 0)
  .step("Increment", step => {
    step.set("count", 1);
    step.focus("count");
  }).program();
assert.equal(compileProgram(program).frames.length, 2);

assert.throws(
  () => compile(["```thl flow", 'node a "A" = 1', 'step "Bad"', "  set a = 2", "  set a = 3", "```"].join("\n")),
  ProgramError,
);

console.log("Throughline v0.0.2 smoke tests: OK");
