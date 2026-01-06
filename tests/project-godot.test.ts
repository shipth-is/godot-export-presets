import { describe, test, expect } from "vitest";
import { ConfigFile } from "../src/index";

describe("[Project.godot] Real-world parsing tests", () => {
  describe("PackedStringArray parsing", () => {
    test("should parse PackedStringArray with multiple elements", () => {
      const configFile = new ConfigFile();
      const configContent = `[application]

config/tags=PackedStringArray("2d", "demo", "official")
`;

      const error = configFile.parse(configContent);

      expect(error).toBeUndefined();
      const tags = configFile.get_value("application", "config/tags");
      expect(tags).toEqual(["2d", "demo", "official"]);
    });

    test("should parse PackedStringArray with single element", () => {
      const configFile = new ConfigFile();
      const configContent = `[application]

config/features=PackedStringArray("4.2")
`;

      const error = configFile.parse(configContent);

      expect(error).toBeUndefined();
      const features = configFile.get_value("application", "config/features");
      expect(features).toEqual(["4.2"]);
    });

    test("should parse empty PackedStringArray", () => {
      const configFile = new ConfigFile();
      const configContent = `[application]

config/tags=PackedStringArray()
`;

      const error = configFile.parse(configContent);

      expect(error).toBeUndefined();
      const tags = configFile.get_value("application", "config/tags");
      expect(tags).toEqual([]);
    });

    test("should parse PoolStringArray (legacy alias)", () => {
      const configFile = new ConfigFile();
      const configContent = `[application]

config/tags=PoolStringArray("legacy", "alias")
`;

      const error = configFile.parse(configContent);

      expect(error).toBeUndefined();
      const tags = configFile.get_value("application", "config/tags");
      expect(tags).toEqual(["legacy", "alias"]);
    });

    test("should parse StringArray (legacy alias)", () => {
      const configFile = new ConfigFile();
      const configContent = `[application]

config/tags=StringArray("another", "alias")
`;

      const error = configFile.parse(configContent);

      expect(error).toBeUndefined();
      const tags = configFile.get_value("application", "config/tags");
      expect(tags).toEqual(["another", "alias"]);
    });
  });

  describe("Dictionary/Object literal parsing", () => {
    test("should parse simple dictionary", () => {
      const configFile = new ConfigFile();
      const configContent = `[input]

move_left={
"deadzone": 0.2
}
`;

      const error = configFile.parse(configContent);

      expect(error).toBeUndefined();
      const moveLeft = configFile.get_value("input", "move_left") as Record<string, unknown>;
      expect(moveLeft).toEqual({ deadzone: 0.2 });
    });

    test("should parse dictionary with multiple keys", () => {
      const configFile = new ConfigFile();
      const configContent = `[input]

move_left={
"deadzone": 0.2,
"events": []
}
`;

      const error = configFile.parse(configContent);

      expect(error).toBeUndefined();
      const moveLeft = configFile.get_value("input", "move_left") as Record<string, unknown>;
      expect(moveLeft).toEqual({ deadzone: 0.2, events: [] });
    });

    test("should parse nested dictionary", () => {
      const configFile = new ConfigFile();
      const configContent = `[test]

nested={
"outer": {
"inner": 42
}
}
`;

      const error = configFile.parse(configContent);

      expect(error).toBeUndefined();
      const nested = configFile.get_value("test", "nested") as Record<string, unknown>;
      expect(nested).toEqual({ outer: { inner: 42 } });
    });
  });

  describe("Array parsing", () => {
    test("should parse simple array of numbers", () => {
      const configFile = new ConfigFile();
      const configContent = `[test]

numbers=[1, 2, 3]
`;

      const error = configFile.parse(configContent);

      expect(error).toBeUndefined();
      const numbers = configFile.get_value("test", "numbers");
      expect(numbers).toEqual([1, 2, 3]);
    });

    test("should parse array of strings", () => {
      const configFile = new ConfigFile();
      const configContent = `[test]

strings=["a", "b", "c"]
`;

      const error = configFile.parse(configContent);

      expect(error).toBeUndefined();
      const strings = configFile.get_value("test", "strings");
      expect(strings).toEqual(["a", "b", "c"]);
    });

    test("should parse mixed type array", () => {
      const configFile = new ConfigFile();
      const configContent = `[test]

mixed=["string", 42, true]
`;

      const error = configFile.parse(configContent);

      expect(error).toBeUndefined();
      const mixed = configFile.get_value("test", "mixed");
      expect(mixed).toEqual(["string", 42, true]);
    });

    test("should parse nested arrays", () => {
      const configFile = new ConfigFile();
      const configContent = `[test]

nested=[[1, 2], [3, 4]]
`;

      const error = configFile.parse(configContent);

      expect(error).toBeUndefined();
      const nested = configFile.get_value("test", "nested");
      expect(nested).toEqual([[1, 2], [3, 4]]);
    });

    test("should parse empty array", () => {
      const configFile = new ConfigFile();
      const configContent = `[test]

empty=[]
`;

      const error = configFile.parse(configContent);

      expect(error).toBeUndefined();
      const empty = configFile.get_value("test", "empty");
      expect(empty).toEqual([]);
    });
  });

  describe("Complex real-world example", () => {
    test("should parse input mapping with dictionary and array", () => {
      const configFile = new ConfigFile();
      const configContent = `[input]

move_left={
"deadzone": 0.2,
"events": ["event1", "event2"]
}
`;

      const error = configFile.parse(configContent);

      expect(error).toBeUndefined();
      const moveLeft = configFile.get_value("input", "move_left") as Record<string, unknown>;
      expect(moveLeft.deadzone).toBe(0.2);
      expect(moveLeft.events).toEqual(["event1", "event2"]);
    });
  });

  describe("Full project.godot example", () => {
    test("should parse minimal project.godot structure", () => {
      const configFile = new ConfigFile();
      const configContent = `; Engine configuration file.
; It's best edited using the editor UI and not directly,
; since the parameters that go here are not all obvious.
;
; Format:
;   [section] ; section goes between []
;   param=value ; assign values to parameters

config_version=5

[application]

config/name="Dodge the Creeps"
config/description="This is a simple game where your character must move
and avoid the enemies for as long as possible.

This is a finished version of the game featured in the 'Your first 2D game'
tutorial in the documentation. For more details, consider
following the tutorial in the documentation."
config/tags=PackedStringArray("2d", "demo", "official")
run/main_scene="res://Main.tscn"
config/features=PackedStringArray("4.2")
config/icon="res://icon.webp"

[display]

window/size/viewport_width=480
window/size/viewport_height=720
`;

      const error = configFile.parse(configContent);

      expect(error).toBeUndefined();
      
      // Test PackedStringArray values
      const tags = configFile.get_value("application", "config/tags");
      expect(tags).toEqual(["2d", "demo", "official"]);
      
      const features = configFile.get_value("application", "config/features");
      expect(features).toEqual(["4.2"]);
      
      // Test other values
      expect(configFile.get_value("application", "config/name")).toBe("Dodge the Creeps");
      expect(configFile.get_value("display", "window/size/viewport_width")).toBe(480);
    });

    test("should parse complete project.godot with input mappings", () => {
      const configFile = new ConfigFile();
      const configContent = `; Engine configuration file.
config_version=5

[application]

config/name="Dodge the Creeps"
config/tags=PackedStringArray("2d", "demo", "official")
config/features=PackedStringArray("4.2")
run/main_scene="res://Main.tscn"
config/icon="res://icon.webp"

[display]

window/size/viewport_width=480
window/size/viewport_height=720

[input]

move_left={
"deadzone": 0.2,
"events": ["event1", "event2"]
}
move_right={
"deadzone": 0.2,
"events": []
}
`;

      const error = configFile.parse(configContent);

      expect(error).toBeUndefined();
      
      // Test PackedStringArray
      const tags = configFile.get_value("application", "config/tags");
      expect(tags).toEqual(["2d", "demo", "official"]);
      
      // Test dictionary with array
      const moveLeft = configFile.get_value("input", "move_left") as Record<string, unknown>;
      expect(moveLeft.deadzone).toBe(0.2);
      expect(moveLeft.events).toEqual(["event1", "event2"]);
      
      const moveRight = configFile.get_value("input", "move_right") as Record<string, unknown>;
      expect(moveRight.deadzone).toBe(0.2);
      expect(moveRight.events).toEqual([]);
    });

    test("should parse user's actual project.godot file structure", () => {
      const configFile = new ConfigFile();
      // This is the actual content from the user's project.godot file
      const configContent = `; Engine configuration file.
; It's best edited using the editor UI and not directly,
; since the parameters that go here are not all obvious.
;
; Format:
;   [section] ; section goes between []
;   param=value ; assign values to parameters

config_version=5

[application]

config/name="Dodge the Creeps"
config/description="This is a simple game where your character must move
and avoid the enemies for as long as possible.

This is a finished version of the game featured in the 'Your first 2D game'
tutorial in the documentation. For more details, consider
following the tutorial in the documentation."
config/tags=PackedStringArray("2d", "demo", "official")
run/main_scene="res://Main.tscn"
config/features=PackedStringArray("4.2")
config/icon="res://icon.webp"

[display]

window/size/viewport_width=480
window/size/viewport_height=720
window/size/window_width_override=480
window/size/window_height_override=720
window/stretch/mode="canvas_items"

[input]

move_left={
"deadzone": 0.2,
"events": []
}
move_right={
"deadzone": 0.2,
"events": []
}
move_up={
"deadzone": 0.2,
"events": []
}
move_down={
"deadzone": 0.2,
"events": []
}
start_game={
"deadzone": 0.2,
"events": []
}

[rendering]

renderer/rendering_method="gl_compatibility"
renderer/rendering_method.mobile="gl_compatibility"
`;

      const error = configFile.parse(configContent);

      expect(error).toBeUndefined();
      
      // Verify PackedStringArray parsing (the original failing case)
      const tags = configFile.get_value("application", "config/tags");
      expect(tags).toEqual(["2d", "demo", "official"]);
      
      const features = configFile.get_value("application", "config/features");
      expect(features).toEqual(["4.2"]);
      
      // Verify dictionary parsing for input mappings
      const moveLeft = configFile.get_value("input", "move_left") as Record<string, unknown>;
      expect(moveLeft.deadzone).toBe(0.2);
      expect(Array.isArray(moveLeft.events)).toBe(true);
      
      // Verify other values
      expect(configFile.get_value("application", "config/name")).toBe("Dodge the Creeps");
      expect(configFile.get_value("display", "window/size/viewport_width")).toBe(480);
      expect(configFile.get_value("rendering", "renderer/rendering_method")).toBe("gl_compatibility");
    });
  });
});

