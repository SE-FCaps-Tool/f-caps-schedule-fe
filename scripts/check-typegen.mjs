#!/usr/bin/env node

// Regenerate the committed API artifacts from an explicit backend contract and
// fail when the generated result is not committed in the frontend repository.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceSpecPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(root, "../f-caps-schedule-be/apps/api/openapi.json");

const generatedFiles = [
  "lib/api/generated/openapi.json",
  "lib/api/generated/schema.d.ts",
];
const generatedSpecPath = path.join(root, generatedFiles[0]);

if (!existsSync(sourceSpecPath)) {
  throw new Error(`Không tìm thấy contract BE: ${sourceSpecPath}`);
}

function sha256(filePath) {
  if (!existsSync(filePath)) return "missing";
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

const committedSpecHash = sha256(generatedSpecPath);
const backendSpecHash = sha256(sourceSpecPath);

console.log(`BE contract: ${sourceSpecPath}`);
console.log(`BE SHA256: ${backendSpecHash}`);
console.log(`FE generated SHA256 before typegen: ${committedSpecHash}`);

execFileSync(
  process.execPath,
  [path.join(root, "scripts/typegen.mjs"), sourceSpecPath],
  { cwd: root, stdio: "inherit" },
);

const generatedHash = sha256(generatedSpecPath);
if (generatedHash !== backendSpecHash) {
  throw new Error(
    `Typegen không tạo ra contract giống BE (BE=${backendSpecHash}, FE=${generatedHash})`,
  );
}

const status = execFileSync(
  "git",
  ["status", "--short", "--untracked-files=all", "--", ...generatedFiles],
  { cwd: root, encoding: "utf8" },
).trim();

if (status) {
  console.error("Generated API artifacts chưa được commit:");
  console.error(status);
  console.error(
    "Hãy chạy npm run typegen -- <path-to-be-openapi.json> rồi commit cả openapi.json và schema.d.ts.",
  );
  process.exit(1);
}

console.log("FE generated API artifacts khớp contract BE và đã được commit.");
