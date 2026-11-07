import "server-only";

import { readFile, writeFile } from "node:fs/promises";

let writeQueue = Promise.resolve();

export async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

export async function writeJson<T>(filePath: string, value: T) {
  writeQueue = writeQueue.then(() =>
    writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8"),
  );
  await writeQueue;
}
