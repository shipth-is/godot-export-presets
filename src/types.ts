/**
 * Type definitions for Godot config file types
 */

export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Vector2 {
  x: number;
  y: number;
}


/**
 * An array value that remembers the Godot type it was written as, so that
 * PackedStringArray("a") does not come back as a bare [a] and get written
 * out as something Godot cannot parse.
 *
 * It is a real Array, so existing code that reads it as one keeps working.
 * godotType is non-enumerable and derived operations (map, filter, spread)
 * give back a plain Array.
 */
export class GodotArray<T = unknown> extends Array<T> {
  declare godotType?: string;

  static get [Symbol.species](): ArrayConstructor {
    return Array;
  }
}

/**
 * Any other Godot constructor value - Vector3(1, 2, 3), NodePath("x"),
 * Rect2(...). We keep the name and the arguments so it round-trips, without
 * needing a case for every type Godot can write.
 */
export class GodotConstructor {
  constructor(
    public readonly name: string,
    public readonly args: unknown[]
  ) {}
}

/**
 * Build a GodotArray tagged with the type name it was parsed from.
 */
export function makeGodotArray<T>(godotType: string, items: T[]): GodotArray<T> {
  const arr = new GodotArray<T>();
  for (const item of items) {
    arr.push(item);
  }
  Object.defineProperty(arr, "godotType", {
    value: godotType,
    enumerable: false,
    writable: true,
    configurable: true,
  });
  return arr;
}

/**
 * True for the Godot type names that are written as a list of values -
 * PackedStringArray, PoolIntArray, and so on.
 */
export function isGodotArrayType(name: string): boolean {
  return /^(Packed|Pool)\w*Array$/.test(name) || name === "StringArray";
}
