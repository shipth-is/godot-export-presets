/**
 * Merging functions for presets and options
 */

import type { ExportPreset, PresetOptions } from "./types.js";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === "[object Object]"
  );
}

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...target };

  for (const [key, sourceValue] of Object.entries(source)) {
    const targetValue = result[key];

    if (
      isPlainObject(targetValue) &&
      isPlainObject(sourceValue) &&
      key !== "options"
    ) {
      // Deep merge objects (except options which we handle separately)
      result[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      );
    } else {
      // Override with source value
      result[key] = sourceValue;
    }
  }

  return result;
}

export function mergePresets(...presets: ExportPreset[]): ExportPreset {
  if (presets.length === 0) {
    throw new Error("At least one preset required for merging");
  }

  if (presets.length === 1) {
    return {
      ...presets[0],
      options: presets[0].options ? { ...presets[0].options } : undefined,
    };
  }

  // Start with first preset (deep copy)
  let merged: ExportPreset = {
    ...presets[0],
    options: presets[0].options ? { ...presets[0].options } : undefined,
  };

  // Merge each subsequent preset
  for (let i = 1; i < presets.length; i++) {
    const current = presets[i];

    // Deep merge the main preset properties (excluding options)
    const currentWithoutOptions: Record<string, unknown> = { ...current };
    delete currentWithoutOptions.options;

    merged = deepMerge(
      merged as Record<string, unknown>,
      currentWithoutOptions
    ) as ExportPreset;

    // Merge options separately (always merge, even if one is undefined)
    merged.options = mergeOptions(
      merged.options || {},
      current.options || {}
    );
  }

  return merged;
}

export function mergeOptions(...options: PresetOptions[]): PresetOptions {
  if (options.length === 0) {
    return {};
  }

  if (options.length === 1) {
    return { ...options[0] };
  }

  // Simple shallow merge for options (they're flat key-value pairs)
  const merged: PresetOptions = {};
  for (const opts of options) {
    Object.assign(merged, opts);
  }

  return merged;
}

