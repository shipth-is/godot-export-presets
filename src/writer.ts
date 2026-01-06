/**
 * Writer for Godot config file format
 * Serializes values back to config format matching Godot's output
 */

import type { Color, Vector2 } from "./types.js";

function needs_quotes(str: string): boolean {
  // Quote if contains special characters, spaces, or Unicode characters
  // Based on Godot's property_name_encode() logic:
  // Quote if contains: =, ", ;, [, ], or characters < 33 or > 126
  if (str.length === 0) return true;
  
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (
      code === 61 || // =
      code === 34 || // "
      code === 59 || // ;
      code === 91 || // [
      code === 93 || // ]
      code < 33 ||   // control characters and space
      code > 126     // extended ASCII and Unicode
    ) {
      return true;
    }
  }
  
  return false;
}

function encode_key(key: string): string {
  if (needs_quotes(key)) {
    // Escape quotes and backslashes
    const escaped = key.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `"${escaped}"`;
  }
  return key;
}

function escape_string(str: string): string {
  // Don't escape newlines - preserve them for multi-line strings
  // Godot preserves newlines in strings when writing
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
}

function serialize_value(value: unknown): string {
  if (value === null || value === undefined) {
    return "null";
  }

  if (typeof value === "string") {
    return `"${escape_string(value)}"`;
  }

  if (typeof value === "number") {
    if (isNaN(value)) {
      return "nan";
    }
    if (!isFinite(value)) {
      return value > 0 ? "inf" : "-inf";
    }
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  // Check for Color object
  if (
    typeof value === "object" &&
    value !== null &&
    "r" in value &&
    "g" in value &&
    "b" in value &&
    "a" in value &&
    typeof (value as Color).r === "number" &&
    typeof (value as Color).g === "number" &&
    typeof (value as Color).b === "number" &&
    typeof (value as Color).a === "number"
  ) {
    const color = value as Color;
    return `Color(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
  }

  // Check for Vector2 object
  if (
    typeof value === "object" &&
    value !== null &&
    "x" in value &&
    "y" in value &&
    typeof (value as Vector2).x === "number" &&
    typeof (value as Vector2).y === "number"
  ) {
    const vec = value as Vector2;
    return `Vector2(${vec.x}, ${vec.y})`;
  }

  // Fallback: try to stringify
  return String(value);
}

export function serialize_config(
  values: Map<string, Map<string, unknown>>
): string {
  const sections: string[] = [];
  let first = true;

  for (const [section, keys] of values.entries()) {
    if (!first) {
      sections.push("");
    }
    first = false;

    if (section) {
      // Escape brackets in section name
      const escapedSection = section.replace(/\]/g, "\\]");
      sections.push(`[${escapedSection}]`);
      sections.push("");
    }

    for (const [key, value] of keys.entries()) {
      const encodedKey = encode_key(key);
      const serializedValue = serialize_value(value);
      sections.push(`${encodedKey}=${serializedValue}`);
    }
  }

  const result = sections.join("\n");
  // Godot adds a trailing newline after the last line
  return result + "\n";
}

