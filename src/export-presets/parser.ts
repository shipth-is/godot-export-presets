/**
 * Parser for export_presets.cfg file format
 */

import { ConfigFile } from "../config-file.js";
import type { ExportPreset, ExportPresetsFile, PresetOptions } from "./types.js";

export function parseExportPresets(content: string): ExportPresetsFile {
  const configFile = new ConfigFile();
  const error = configFile.parse(content);

  if (error) {
    throw error;
  }

  const presets: ExportPreset[] = [];
  const sections = configFile.get_sections();

  // Find all preset sections (preset.0, preset.1, etc.)
  const presetSections = sections
    .filter((s) => s.startsWith("preset.") && !s.includes(".options"))
    .sort((a, b) => {
      const aNum = parseInt(a.split(".")[1] || "0", 10);
      const bNum = parseInt(b.split(".")[1] || "0", 10);
      return aNum - bNum;
    });

  for (const presetSection of presetSections) {
    const preset: ExportPreset = {
      name: "",
      platform: "",
      runnable: false,
    };

    // Get all keys from the preset section
    const keys = configFile.get_section_keys(presetSection);
    for (const key of keys) {
      const value = configFile.get_value(presetSection, key);
      if (key === "options") {
        // This shouldn't happen, but handle it
        continue;
      }
      (preset as Record<string, unknown>)[key] = value;
    }

    // Get options from preset.X.options section
    const optionsSection = `${presetSection}.options`;
    if (configFile.has_section(optionsSection)) {
      const options: PresetOptions = {};
      const optionKeys = configFile.get_section_keys(optionsSection);
      for (const key of optionKeys) {
        options[key] = configFile.get_value(optionsSection, key);
      }
      preset.options = options;
    }

    presets.push(preset);
  }

  return { presets };
}

