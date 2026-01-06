import { describe, test, expect } from "vitest";
import { tmpdir } from "node:os";
import { readFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import {
  parseExportPresets,
  serializeExportPresets,
  loadExportPresets,
  saveExportPresets,
  getPreset,
  findPreset,
  setPreset,
  removePreset,
  mergePresets,
  mergeOptions,
  type ExportPreset,
  type ExportPresetsFile,
} from "../src/export-presets/index.js";

describe("Phase 1: File Structure Parsing", () => {
  test("Parse single preset with options", () => {
    const content = `[preset.0]

name="Android"
platform="Android"
runnable=true
dedicated_server=false
custom_features=""
export_filter="all_resources"
include_filter=""
exclude_filter=""
export_path=""
encrypt_pck=false
encrypt_directory=false

[preset.0.options]

package/unique_name="com.example.$genname"
package/name=""
package/signed=true
architectures/arm64-v8a=true
architectures/armeabi-v7a=false
`;

    const result = parseExportPresets(content);

    expect(result.presets).toHaveLength(1);
    expect(result.presets[0].name).toBe("Android");
    expect(result.presets[0].platform).toBe("Android");
    expect(result.presets[0].runnable).toBe(true);
    expect(result.presets[0].dedicated_server).toBe(false);
    expect(result.presets[0].options).toBeDefined();
    expect(result.presets[0].options?.["package/unique_name"]).toBe(
      "com.example.$genname"
    );
    expect(result.presets[0].options?.["architectures/arm64-v8a"]).toBe(true);
  });

  test("Parse multiple presets", () => {
    const content = `[preset.0]

name="Android"
platform="Android"
runnable=true

[preset.0.options]

package/unique_name="com.example"

[preset.1]

name="iOS"
platform="iOS"
runnable=true

[preset.1.options]

application/identifier="com.example.ios"
`;

    const result = parseExportPresets(content);

    expect(result.presets).toHaveLength(2);
    expect(result.presets[0].name).toBe("Android");
    expect(result.presets[0].platform).toBe("Android");
    expect(result.presets[1].name).toBe("iOS");
    expect(result.presets[1].platform).toBe("iOS");
    expect(result.presets[0].options?.["package/unique_name"]).toBe(
      "com.example"
    );
    expect(result.presets[1].options?.["application/identifier"]).toBe(
      "com.example.ios"
    );
  });

  test("Handle missing options section", () => {
    const content = `[preset.0]

name="Android"
platform="Android"
runnable=true
`;

    const result = parseExportPresets(content);

    expect(result.presets).toHaveLength(1);
    expect(result.presets[0].options).toBeUndefined();
  });
});

describe("Phase 2: File Writing", () => {
  test("Write single preset", async () => {
    const preset: ExportPreset = {
      name: "Android",
      platform: "Android",
      runnable: true,
      dedicated_server: false,
      options: {
        "package/unique_name": "com.example",
        "architectures/arm64-v8a": true,
      },
    };

    const presets: ExportPresetsFile = { presets: [preset] };
    const content = serializeExportPresets(presets);

    // Parse it back to verify
    const parsed = parseExportPresets(content);
    expect(parsed.presets).toHaveLength(1);
    expect(parsed.presets[0].name).toBe("Android");
    expect(parsed.presets[0].options?.["package/unique_name"]).toBe(
      "com.example"
    );
  });

  test("Write multiple presets", async () => {
    const presets: ExportPresetsFile = {
      presets: [
        {
          name: "Android",
          platform: "Android",
          runnable: true,
          options: { "package/unique_name": "com.example" },
        },
        {
          name: "iOS",
          platform: "iOS",
          runnable: true,
          options: { "application/identifier": "com.example.ios" },
        },
      ],
    };

    const content = serializeExportPresets(presets);
    const parsed = parseExportPresets(content);

    expect(parsed.presets).toHaveLength(2);
    expect(parsed.presets[0].name).toBe("Android");
    expect(parsed.presets[1].name).toBe("iOS");
  });

  test("Round-trip test", async () => {
    const original: ExportPresetsFile = {
      presets: [
        {
          name: "Android",
          platform: "Android",
          runnable: true,
          export_path: "game.apk",
          options: {
            "package/unique_name": "com.example",
            "architectures/arm64-v8a": true,
          },
        },
      ],
    };

    const serialized = serializeExportPresets(original);
    const parsed = parseExportPresets(serialized);

    expect(parsed.presets).toHaveLength(1);
    expect(parsed.presets[0]).toEqual(original.presets[0]);
  });
});

describe("Phase 3: Preset Operations", () => {
  test("Get preset by index", () => {
    const presets: ExportPresetsFile = {
      presets: [
        { name: "Android", platform: "Android", runnable: true },
        { name: "iOS", platform: "iOS", runnable: true },
      ],
    };

    expect(getPreset(presets, 0)?.name).toBe("Android");
    expect(getPreset(presets, 1)?.name).toBe("iOS");
    expect(getPreset(presets, 2)).toBeUndefined();
  });

  test("Find preset by criteria", () => {
    const presets: ExportPresetsFile = {
      presets: [
        { name: "Android", platform: "Android", runnable: true },
        { name: "iOS", platform: "iOS", runnable: true },
      ],
    };

    // Find by platform (case-insensitive)
    expect(findPreset(presets, { platform: "android" })?.name).toBe("Android");
    expect(findPreset(presets, { platform: "ANDROID" })?.name).toBe("Android");
    expect(findPreset(presets, { platform: "iOS" })?.name).toBe("iOS");

    // Find by name
    expect(findPreset(presets, { name: "Android" })?.platform).toBe("Android");

    // Find by index
    expect(findPreset(presets, { index: 0 })?.name).toBe("Android");
    expect(findPreset(presets, { index: 1 })?.name).toBe("iOS");

    // Not found
    expect(findPreset(presets, { platform: "Linux" })).toBeUndefined();
  });

  test("Set preset (add)", () => {
    const presets: ExportPresetsFile = { presets: [] };
    const newPreset: ExportPreset = {
      name: "Android",
      platform: "Android",
      runnable: true,
    };

    const updated = setPreset(presets, newPreset);
    expect(updated.presets).toHaveLength(1);
    expect(updated.presets[0].name).toBe("Android");
  });

  test("Set preset (update)", () => {
    const presets: ExportPresetsFile = {
      presets: [
        { name: "Android", platform: "Android", runnable: true },
      ],
    };

    const updatedPreset: ExportPreset = {
      name: "Android",
      platform: "Android",
      runnable: false, // Changed
      export_path: "game.apk", // Added
    };

    const updated = setPreset(presets, updatedPreset, 0);
    expect(updated.presets).toHaveLength(1);
    expect(updated.presets[0].runnable).toBe(false);
    expect(updated.presets[0].export_path).toBe("game.apk");
  });

  test("Remove preset", () => {
    const presets: ExportPresetsFile = {
      presets: [
        { name: "Android", platform: "Android", runnable: true },
        { name: "iOS", platform: "iOS", runnable: true },
      ],
    };

    const updated = removePreset(presets, 0);
    expect(updated.presets).toHaveLength(1);
    expect(updated.presets[0].name).toBe("iOS");
  });
});

describe("Phase 4: Merging", () => {
  test("Merge presets", () => {
    const base: ExportPreset = {
      name: "Android",
      platform: "Android",
      runnable: true,
      export_path: "game.apk",
      options: {
        "architectures/arm64-v8a": true,
        "architectures/armeabi-v7a": false,
      },
    };

    const override: ExportPreset = {
      name: "Android",
      platform: "Android",
      runnable: false, // Override
      export_path: "game.aab", // Override
      options: {
        "architectures/armeabi-v7a": true, // Override
        "package/unique_name": "com.example", // New
      },
    };

    const merged = mergePresets(base, override);
    expect(merged.runnable).toBe(false); // Overridden
    expect(merged.export_path).toBe("game.aab"); // Overridden
    expect(merged.options?.["architectures/arm64-v8a"]).toBe(true); // Preserved
    expect(merged.options?.["architectures/armeabi-v7a"]).toBe(true); // Overridden
    expect(merged.options?.["package/unique_name"]).toBe("com.example"); // New
  });

  test("Merge edge cases", () => {
    // Merge with undefined options
    const preset1: ExportPreset = {
      name: "Android",
      platform: "Android",
      runnable: true,
    };

    const preset2: ExportPreset = {
      name: "Android",
      platform: "Android",
      runnable: false,
      options: { "package/unique_name": "com.example" },
    };

    const merged = mergePresets(preset1, preset2);
    expect(merged.options?.["package/unique_name"]).toBe("com.example");
  });
});

describe("Phase 5: Error Handling", () => {
  test("Invalid file format", () => {
    const invalidContent = `[preset.0]
name="Android"
[preset.0.options
package/unique_name="com.example"
`;

    expect(() => parseExportPresets(invalidContent)).toThrow();
  });

  test("File I/O operations", async () => {
    const presets: ExportPresetsFile = {
      presets: [
        {
          name: "Android",
          platform: "Android",
          runnable: true,
          options: { "package/unique_name": "com.example" },
        },
      ],
    };

    const filePath = join(tmpdir(), "test_export_presets.cfg");

    // Save
    await saveExportPresets(filePath, presets);

    // Load
    const loaded = await loadExportPresets(filePath);
    expect(loaded.presets).toHaveLength(1);
    expect(loaded.presets[0].name).toBe("Android");

    // Cleanup
    await unlink(filePath);
  });
});

