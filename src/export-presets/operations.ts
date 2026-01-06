/**
 * Preset operations: get, find, set, remove
 */

import type {
  ExportPreset,
  ExportPresetsFile,
  FindPresetCriteria,
} from "./types.js";

export function getPreset(
  presets: ExportPresetsFile,
  index: number
): ExportPreset | undefined {
  if (index < 0 || index >= presets.presets.length) {
    return undefined;
  }
  return presets.presets[index];
}

export function findPreset(
  presets: ExportPresetsFile,
  criteria: FindPresetCriteria
): ExportPreset | undefined {
  if (criteria.index !== undefined) {
    return getPreset(presets, criteria.index);
  }

  for (const preset of presets.presets) {
    if (criteria.platform) {
      const presetPlatform = String(preset.platform || "").trim().toUpperCase();
      const searchPlatform = criteria.platform.trim().toUpperCase();
      if (presetPlatform === searchPlatform) {
        return preset;
      }
    }

    if (criteria.name) {
      const presetName = String(preset.name || "").trim().toUpperCase();
      const searchName = criteria.name.trim().toUpperCase();
      if (presetName === searchName) {
        return preset;
      }
    }
  }

  return undefined;
}

export function setPreset(
  presets: ExportPresetsFile,
  preset: ExportPreset,
  index?: number
): ExportPresetsFile {
  const newPresets = [...presets.presets];

  if (index !== undefined && index >= 0 && index < newPresets.length) {
    // Update existing preset
    newPresets[index] = preset;
  } else {
    // Add new preset
    newPresets.push(preset);
  }

  return { presets: newPresets };
}

export function removePreset(
  presets: ExportPresetsFile,
  index: number
): ExportPresetsFile {
  if (index < 0 || index >= presets.presets.length) {
    return presets;
  }

  const newPresets = [...presets.presets];
  newPresets.splice(index, 1);
  return { presets: newPresets };
}

