#!/usr/bin/env node
// Sinh `lib/api/generated/schema.d.ts` từ đặc tả wire duy nhất của BE.
// Copy spec vào repo trước khi generate, để build FE không phụ thuộc mạng hay
// checkout BE sau khi đã commit kết quả.
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const defaultSpecPath = path.resolve(root, "../f-caps-schedule-be/apps/api/openapi.json");
const sourceSpecPath = process.argv[2] ? path.resolve(process.argv[2]) : defaultSpecPath;

const genDir = path.join(root, "lib/api/generated");
mkdirSync(genDir, { recursive: true });

const localSpecPath = path.join(genDir, "openapi.json");
copyFileSync(sourceSpecPath, localSpecPath);

const spec = JSON.parse(readFileSync(localSpecPath, "utf8"));
const beCommit = spec.info?.["x-be-commit"] ?? "unknown";
const wireCase = spec.info?.["x-be-wire-case"] ?? "unknown";
if (wireCase !== "camelCase") {
  throw new Error(`Spec nguồn không phải camelCase (x-be-wire-case=${wireCase})`);
}

const outPath = path.join(genDir, "schema.d.ts");
execFileSync("npx", ["openapi-typescript", localSpecPath, "-o", outPath], { stdio: "inherit", shell: true });

const header = `/**\n * TỰ SINH — không sửa tay. Sinh lại: npm run typegen\n * Nguồn: BE commit ${beCommit} (openapi.json, wire case ${wireCase})\n */\n`;
writeFileSync(outPath, header + readFileSync(outPath, "utf8"));

console.log(`Typegen xong — BE commit ${beCommit}.`);
