/**
 * File I/O operations for export presets
 */

import { readFile, writeFile } from "node:fs/promises";
import { parseExportPresets } from "./parser.js";
import { serializeExportPresets } from "./serializer.js";
import type { ExportPresetsFile } from "./types.js";

export async function loadExportPresets(
  filePath: string
): Promise<ExportPresetsFile> {
  try {
    const content = await readFile(filePath, "utf-8");
    return parseExportPresets(content);
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      throw new Error(`File not found: ${filePath}`);
    }
    throw error;
  }
}

export async function saveExportPresets(
  filePath: string,
  presets: ExportPresetsFile
): Promise<void> {
  const content = serializeExportPresets(presets);
  await writeFile(filePath, content, "utf-8");
}

