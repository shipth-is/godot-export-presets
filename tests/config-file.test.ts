import { describe, test, expect } from "vitest";
import { tmpdir } from "node:os";
import { readFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { ConfigFile } from "../src/index";

describe("[ConfigFile] Parsing well-formatted files", () => {
  test("should parse well-formatted config file with various data types", () => {
    const configFile = new ConfigFile();
    // Formatting is intentionally hand-edited to see how human-friendly the parser is.
    const configContent = `
[player]

name = "Unnamed Player"
tagline="Waiting
for
Godot"

color =Color(   0, 0.5,1, 1) ; Inline comment
position= Vector2(
	3,
	4
)

[graphics]

antialiasing = true

; Testing comments and case-sensitivity...
antiAliasing = false
`;

    const error = configFile.parse(configContent);

    expect(error).toBeUndefined(); // OK means no error
    expect(configFile.get_value("player", "name")).toBe("Unnamed Player");
    expect(configFile.get_value("player", "tagline")).toBe("Waiting\nfor\nGodot");
    
    // Color comparison - using object with r, g, b properties
    const color = configFile.get_value("player", "color") as { r: number; g: number; b: number; a: number };
    expect(color.r).toBeCloseTo(0);
    expect(color.g).toBeCloseTo(0.5);
    expect(color.b).toBeCloseTo(1);
    
    // Vector2 comparison
    const position = configFile.get_value("player", "position") as { x: number; y: number };
    expect(position.x).toBeCloseTo(3);
    expect(position.y).toBeCloseTo(4);
    
    expect(configFile.get_value("graphics", "antialiasing")).toBe(true);
    expect(configFile.get_value("graphics", "antiAliasing")).toBe(false);
  });

  test("should parse empty config file successfully", () => {
    const configFile = new ConfigFile();
    const error = configFile.parse("");
    
    expect(error).toBeUndefined(); // An empty ConfigFile is valid
  });
});

describe("[ConfigFile] Parsing malformatted file", () => {
  test("should return parse error for malformatted config file", () => {
    const configFile = new ConfigFile();
    const configContent = `
[player]

name = "Unnamed Player"" ; Extraneous closing quote.
tagline = "Waiting\nfor\nGodot"

color = Color(0, 0.5, 1) ; Missing 4th parameter.
position = Vector2(
	3,,
	4
) ; Extraneous comma.

[graphics]

antialiasing = true
antialiasing = false ; Duplicate key.
`;

    const error = configFile.parse(configContent);

    expect(error).toBeDefined(); // Should return parse error
    expect(error).toBeInstanceOf(Error);
  });
});

describe("[ConfigFile] Saving file", () => {
  test("should save config file with correct format", async () => {
    const configFile = new ConfigFile();
    configFile.set_value("player", "name", "Unnamed Player");
    configFile.set_value("player", "tagline", "Waiting\nfor\nGodot");
    configFile.set_value("player", "color", { r: 0, g: 0.5, b: 1, a: 1 });
    configFile.set_value("player", "position", { x: 3, y: 4 });
    configFile.set_value("graphics", "antialiasing", true);
    configFile.set_value("graphics", "antiAliasing", false);
    configFile.set_value("quoted", "静音", 42);
    configFile.set_value("quoted", "a=b", 7);

    const configPath = join(tmpdir(), "config.ini");

    await configFile.save(configPath);

    // Expected contents of the saved ConfigFile.
    const expectedContents = `[player]

name="Unnamed Player"
tagline="Waiting
for
Godot"
color=Color(0, 0.5, 1, 1)
position=Vector2(3, 4)

[graphics]

antialiasing=true
antiAliasing=false

[quoted]

"静音"=42
"a=b"=7
`;

    const fileContents = await readFile(configPath, "utf-8");
    
    expect(fileContents).toBe(expectedContents);
    
    // Cleanup
    await unlink(configPath);
  });
});

