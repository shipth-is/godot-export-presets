/**
 * Serializer for export_presets.cfg file format
 */

import { ConfigFile } from "../config-file.js";
import type { ExportPreset, ExportPresetsFile } from "./types.js";

export function serializeExportPresets(presets: ExportPresetsFile): string {
  const configFile = new ConfigFile();

  for (let i = 0; i < presets.presets.length; i++) {
    const preset = presets.presets[i];
    const presetSection = `preset.${i}`;
    const optionsSection = `${presetSection}.options`;

    // Write preset properties (excluding options)
    for (const [key, value] of Object.entries(preset)) {
      if (key === "options") {
        continue;
      }
      configFile.set_value(presetSection, key, value);
    }

    // Write options
    if (preset.options) {
      for (const [key, value] of Object.entries(preset.options)) {
        configFile.set_value(optionsSection, key, value);
      }
    }
  }

  // Use ConfigFile's internal serialization
  return configFile.encode_to_text();
}

