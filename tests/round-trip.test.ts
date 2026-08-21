import { describe, expect, test } from "vitest";
import {
  ConfigFile,
  GodotArray,
  GodotConstructor,
  getBasePreset,
  parseExportPresets,
  serializeExportPresets,
} from "../src/index.js";

/**
 * Read a single option value back out of a config file.
 */
function parseOption(literal: string): unknown {
  const config = new ConfigFile();
  const error = config.parse(`[section]\n\nkey=${literal}\n`);
  if (error) {
    throw error;
  }
  return config.get_value("section", "key");
}

/**
 * Write one value out and return the line it produced.
 */
function serializeOption(value: unknown): string {
  const config = new ConfigFile();
  config.set_value("section", "key", value);
  // The value can span several lines, so take everything after the key
  const text = config.encode_to_text();
  return text.slice(text.indexOf("key=") + "key=".length).replace(/\n$/, "");
}

function roundTrip(literal: string): string {
  return serializeOption(parseOption(literal));
}

describe("round-trip of Godot values", () => {
  const unchanged = [
    'PackedStringArray("a", "b")',
    "PackedStringArray()",
    'PoolStringArray( "a", "b" )',
    "PoolStringArray(  )",
    "PackedInt32Array(1, 2)",
    "PackedFloat32Array(1.5, 2.5)",
    "PoolIntArray( 1, 2 )",
    "Vector2(1, 2)",
    "Vector3(1, 2, 3)",
    "Color(1, 0, 0, 1)",
    'NodePath("Player/Sprite")',
    "Rect2(0, 0, 10, 10)",
    '"res://icon.png"',
    "true",
    "2",
    "-3",
    "1.5",
    '""',
  ];

  for (const literal of unchanged) {
    test(`${literal} survives a read/write cycle`, () => {
      expect(roundTrip(literal)).toBe(literal);
    });
  }

  test("a dictionary is written the way Godot writes it", () => {
    expect(roundTrip('{\n"a": 1,\n"b": "two"\n}')).toBe('{\n"a": 1,\n"b": "two"\n}');
  });

  test("an untagged array is written as a Godot array", () => {
    expect(roundTrip("[1, 2]")).toBe("[1, 2]");
  });

  test("a nested array inside a constructor survives", () => {
    expect(roundTrip('PackedStringArray("a")')).toBe('PackedStringArray("a")');
  });
});

describe("packed arrays behave like arrays", () => {
  test("reads as a plain array of strings", () => {
    const value = parseOption('PackedStringArray("a", "b")');
    expect(value).toEqual(["a", "b"]);
    expect(Array.isArray(value)).toBe(true);
    expect((value as string[])[1]).toBe("b");
  });

  test("remembers the type it was parsed from", () => {
    const value = parseOption('PoolStringArray( "a" )') as GodotArray;
    expect(value.godotType).toBe("PoolStringArray");
  });

  test("the type tag is not an enumerable property", () => {
    const value = parseOption('PackedStringArray("a")') as GodotArray;
    expect(Object.keys(value)).toEqual(["0"]);
    expect(JSON.stringify(value)).toBe('["a"]');
  });

  test("map and spread give back a plain array", () => {
    const value = parseOption('PackedStringArray("a")') as GodotArray<string>;
    expect(value.map((s) => s).constructor).toBe(Array);
    expect([...value]).toEqual(["a"]);
  });
});

describe("unknown constructors", () => {
  test("an unsupported type is kept instead of throwing", () => {
    const value = parseOption("Transform2D(1, 0, 0, 1, 0, 0)");
    expect(value).toBeInstanceOf(GodotConstructor);
    expect((value as GodotConstructor).name).toBe("Transform2D");
    expect((value as GodotConstructor).args).toEqual([1, 0, 0, 1, 0, 0]);
  });

  test("a bare unknown identifier is still an error", () => {
    expect(() => parseOption("Garbage")).toThrow();
  });
});

describe("a preset with array options", () => {
  const cfg = `[preset.0]

name="Sheep Shuffle"
platform="Android"
runnable=true
script_export_mode=2
export_files=PackedStringArray("res://main.tscn")

[preset.0.options]

architectures/arm64-v8a=true
version/code=7
permissions/custom_permissions=PackedStringArray("android.permission.VIBRATE")
`;

  test("survives parse and serialize unchanged", () => {
    expect(serializeExportPresets(parseExportPresets(cfg))).toBe(cfg);
  });

  test("keeps integers as integers", () => {
    const preset = parseExportPresets(cfg).presets[0];
    expect(preset.script_export_mode).toBe(2);
    expect(preset.options!["version/code"]).toBe(7);
  });
});

describe("base preset defaults", () => {
  const cases = [
    ["Android", 3, "permissions/custom_permissions", "PoolStringArray(  )"],
    ["Android", 4, "permissions/custom_permissions", "PackedStringArray()"],
    ["iOS", 3, "privacy/tracking_domains", "PoolStringArray(  )"],
    ["iOS", 3, "storyboard/custom_bg_color", "Color(0, 0, 0, 1)"],
    ["iOS", 4, "storyboard/custom_bg_color", "Color(0, 0, 0, 1)"],
  ] as const;

  test.each(cases)(
    "%s v%d writes %s as a Godot value, not a quoted string",
    (platform, version, option, expected) => {
      const preset = getBasePreset(platform, version);
      const text = serializeExportPresets({ presets: [preset] });
      expect(text).toContain(`${option}=${expected}\n`);
    }
  );

  test("iOS v4 writes the localized dictionaries as dictionaries", () => {
    const preset = getBasePreset("iOS", 4);
    const text = serializeExportPresets({ presets: [preset] });
    expect(text).toContain("privacy/camera_usage_description_localized={");
    expect(text).not.toContain('_localized="');
  });

  test.each([
    ["Android", 3],
    ["Android", 4],
    ["iOS", 3],
    ["iOS", 4],
  ] as const)("%s v%d survives a write, read and write", (platform, version) => {
    const text = serializeExportPresets({
      presets: [getBasePreset(platform, version)],
    });
    expect(serializeExportPresets(parseExportPresets(text))).toBe(text);
  });
});
