import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { compile, compileProgram, ProgramError, tracer } from "@0xbuff/throughline";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const skillRoot = join(root, "skills", "throughline");

const traces = [
  {
    name: "flow",
    source: [
      "```thl flow",
      'node a "A" = 3',
      'node b "B" = 0',
      "link ab a -> b",
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
const [initial, transferred, received] = flow.frames.map(frame => frame.state);
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

// Compile every complete thl fence embedded in the public skill instructions.
let checked = 0;
for (const path of [
  "SKILL.md",
  "references/grammar.md",
  "references/domains.md",
  "references/integration.md",
  "references/api-and-validation.md",
]) {
  const content = readFileSync(join(skillRoot, path), "utf8");
  for (const match of content.matchAll(/```thl (?:flow|bindings|binary|matrix|callstack)\r?\n[\s\S]*?\r?\n```/g)) {
    try {
      const trace = compile(match[0]);
      assert.equal(trace.version, 1, path);
      assert.ok(trace.frames.length >= 2, path + " should have at least one step");
      checked++;
    } catch (error) {
      throw new Error("An example in " + path + " failed to compile", { cause: error });
    }
  }
}
assert.ok(checked >= 7, "Expected at least seven examples in public skill documents");
console.log("Throughline v0.0.2 checks passed, including " + checked + " documented examples");
