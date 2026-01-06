import { describe, test, expect } from "vitest";
import {
  getBasePreset,
  getBasePreset_Android_v3,
  getBasePreset_Android_v4,
  getBasePreset_iOS_v3,
  getBasePreset_iOS_v4,
  hasBasePreset,
  getMajorVersion,
  type Platform,
  type GodotMajorVersion,
} from "../src/export-presets/index.js";

describe("Base Presets", () => {
  describe("getMajorVersion", () => {
    test("should extract major version from version string", () => {
      expect(getMajorVersion("4.3.2")).toBe(4);
      expect(getMajorVersion("3.5.1")).toBe(3);
      expect(getMajorVersion("4.0.0")).toBe(4);
      expect(getMajorVersion("3.5")).toBe(3);
    });

    test("should throw on invalid version string", () => {
      expect(() => getMajorVersion("invalid")).toThrow();
      expect(() => getMajorVersion("")).toThrow();
    });

    test("should throw on unsupported version", () => {
      expect(() => getMajorVersion("5.0.0")).toThrow();
      expect(() => getMajorVersion("2.0.0")).toThrow();
    });
  });

  describe("hasBasePreset", () => {
    test("should return true for supported combinations", () => {
      expect(hasBasePreset("Android", 3)).toBe(true);
      expect(hasBasePreset("Android", 4)).toBe(true);
      expect(hasBasePreset("iOS", 3)).toBe(true);
      expect(hasBasePreset("iOS", 4)).toBe(true);
    });
  });

  describe("getBasePreset", () => {
    test("should get Android v3 preset", () => {
      const preset = getBasePreset("Android", 3);
      expect(preset.name).toBe("Android");
      expect(preset.platform).toBe("Android");
      expect(preset.runnable).toBe(true);
    });

    test("should get Android v4 preset", () => {
      const preset = getBasePreset("Android", 4);
      expect(preset.name).toBe("Android");
      expect(preset.platform).toBe("Android");
      expect(preset.runnable).toBe(true);
    });

    test("should get iOS v3 preset", () => {
      const preset = getBasePreset("iOS", 3);
      expect(preset.name).toBe("iOS");
      expect(preset.platform).toBe("iOS");
      expect(preset.runnable).toBe(true);
    });

    test("should get iOS v4 preset", () => {
      const preset = getBasePreset("iOS", 4);
      expect(preset.name).toBe("iOS");
      expect(preset.platform).toBe("iOS");
      expect(preset.runnable).toBe(true);
    });

    test("should throw on unsupported platform", () => {
      expect(() =>
        getBasePreset("Linux" as Platform, 4)
      ).toThrow();
    });
  });

  describe("getBasePreset_Android_v3", () => {
    test("should return preset with required fields", () => {
      const preset = getBasePreset_Android_v3();
      expect(preset.name).toBe("Android");
      expect(preset.platform).toBe("Android");
      expect(preset.runnable).toBe(true);
      expect(preset.script_export_mode).toBe(1);
    });

    test("should have options structure", () => {
      const preset = getBasePreset_Android_v3();
      expect(preset.options).toBeDefined();
      expect(preset.options?.["custom_build/use_custom_build"]).toBe(true);
      expect(preset.options?.["architectures/arm64-v8a"]).toBe(true);
    });

    test("should have blank icon fields", () => {
      const preset = getBasePreset_Android_v3();
      expect(preset.options?.["launcher_icons/main_192x192"]).toBe("");
      expect(
        preset.options?.["launcher_icons/adaptive_foreground_432x432"]
      ).toBe("");
      expect(
        preset.options?.["launcher_icons/adaptive_background_432x432"]
      ).toBe("");
    });
  });

  describe("getBasePreset_Android_v4", () => {
    test("should return preset with required fields", () => {
      const preset = getBasePreset_Android_v4();
      expect(preset.name).toBe("Android");
      expect(preset.platform).toBe("Android");
      expect(preset.runnable).toBe(true);
      expect(preset.script_export_mode).toBe(2);
    });

    test("should have options structure", () => {
      const preset = getBasePreset_Android_v4();
      expect(preset.options).toBeDefined();
      expect(preset.options?.["gradle_build/use_gradle_build"]).toBe(true);
      expect(preset.options?.["architectures/arm64-v8a"]).toBe(true);
    });

    test("should have blank icon fields", () => {
      const preset = getBasePreset_Android_v4();
      expect(preset.options?.["launcher_icons/main_192x192"]).toBe("");
      expect(
        preset.options?.["launcher_icons/adaptive_foreground_432x432"]
      ).toBe("");
      expect(
        preset.options?.["launcher_icons/adaptive_background_432x432"]
      ).toBe("");
    });
  });

  describe("getBasePreset_iOS_v3", () => {
    test("should return preset with required fields", () => {
      const preset = getBasePreset_iOS_v3();
      expect(preset.name).toBe("iOS");
      expect(preset.platform).toBe("iOS");
      expect(preset.runnable).toBe(true);
      expect(preset.script_export_mode).toBe(1);
    });

    test("should have options structure", () => {
      const preset = getBasePreset_iOS_v3();
      expect(preset.options).toBeDefined();
      expect(preset.options?.["architectures/arm64"]).toBe(true);
      expect(preset.options?.["application/icon_interpolation"]).toBe(4);
    });

    test("should have blank icon fields", () => {
      const preset = getBasePreset_iOS_v3();
      expect(preset.options?.["icons/app_store_1024x1024"]).toBe("");
      expect(preset.options?.["icons/ipad_152x152"]).toBe("");
      expect(preset.options?.["icons/iphone_120x120"]).toBe("");
      expect(preset.options?.["icons/spotlight_40x40"]).toBe("");
    });
  });

  describe("getBasePreset_iOS_v4", () => {
    test("should return preset with required fields", () => {
      const preset = getBasePreset_iOS_v4();
      expect(preset.name).toBe("iOS");
      expect(preset.platform).toBe("iOS");
      expect(preset.runnable).toBe(true);
    });

    test("should have options structure", () => {
      const preset = getBasePreset_iOS_v4();
      expect(preset.options).toBeDefined();
      expect(preset.options?.["architectures/arm64"]).toBe(true);
      expect(preset.options?.["application/icon_interpolation"]).toBe("4");
    });

    test("should have blank icon fields", () => {
      const preset = getBasePreset_iOS_v4();
      expect(preset.options?.["icons/app_store_1024x1024"]).toBe("");
      expect(preset.options?.["icons/ipad_152x152"]).toBe("");
      expect(preset.options?.["icons/iphone_120x120"]).toBe("");
      expect(preset.options?.["icons/notification_40x40"]).toBe("");
      expect(preset.options?.["icons/settings_58x58"]).toBe("");
      expect(preset.options?.["icons/spotlight_40x40"]).toBe("");
    });
  });
});

