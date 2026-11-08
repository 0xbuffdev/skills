#!/usr/bin/env node
// Validate one or more complete Throughline blocks using the package installed
// in the current project, not in the installed skill directory.
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

const files = process.argv.slice(2);

if (files.length === 0 || files.includes("--help") || files.includes("-h")) {
  console.log("Usage: node <skill-dir>/scripts/validate.mjs <diagram.thl> [other.thl ...]");
  console.log("Run from your project's root after installing @0xbuff/throughline.");
  process.exit(files.length === 0 ? 2 : 0);
}

let compile;
let ProgramError;
try {
  const projectRequire = createRequire(join(process.cwd(), "package.json"));
  const moduleFile = projectRequire.resolve("@0xbuff/throughline");
  ({ compile, ProgramError } = await import(pathToFileURL(moduleFile).href));
} catch (error) {
  console.error("Throughline is unavailable in the current project.");
  console.error("Run from the project's root and install it with: npm install @0xbuff/throughline");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

for (const file of files) {
  const path = resolve(file);
  let source;
  try {
    source = readFileSync(path, "utf8");
  } catch (error) {
    console.error(file + ": cannot read file: " + (error instanceof Error ? error.message : String(error)));
    process.exitCode = 1;
    continue;
  }
  try {
    const trace = compile(source);
    console.log(file + ": OK (" + trace.frames.length + " frames)");
  } catch (error) {
    console.error(file + ": invalid Throughline diagram");
    if (error instanceof ProgramError && Array.isArray(error.diagnostics) && error.diagnostics.length > 0) {
      for (const item of error.diagnostics) {
        const location = Number.isInteger(item.line) ? "line " + item.line + ": " : "";
        console.error("  " + location + item.message);
      }
    } else {
      console.error("  " + (error instanceof Error ? error.message : String(error)));
    }
    process.exitCode = 1;
  }
}
