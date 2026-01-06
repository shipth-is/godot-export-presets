/**
 * ConfigFile class for reading and writing Godot config files
 * Based on Godot's ConfigFile implementation
 */

import { parse_config } from "./parser.js";
import { serialize_config } from "./writer.js";
import { writeFile } from "node:fs/promises";

export class ConfigFile {
  private values = new Map<string, Map<string, unknown>>();

  /**
   * Parse config file content
   * @param content Config file content as string
   * @returns Error if parsing failed, undefined on success
   */
  parse(content: string): Error | undefined {
    const { values, error } = parse_config(content);
    if (error) {
      return error;
    }
    this.values = values;
    return undefined;
  }

  /**
   * Get a value from the config file
   * @param section Section name (empty string for section-less keys)
   * @param key Key name
   * @param defaultValue Optional default value if key doesn't exist
   * @returns The value or default value
   */
  get_value(section: string, key: string, defaultValue?: unknown): unknown {
    const sectionMap = this.values.get(section);
    if (!sectionMap) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(
        `Section "${section}" not found and no default value provided`
      );
    }
    if (!sectionMap.has(key)) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(
        `Key "${key}" not found in section "${section}" and no default value provided`
      );
    }
    return sectionMap.get(key);
  }

  /**
   * Set a value in the config file
   * @param section Section name (empty string for section-less keys)
   * @param key Key name
   * @param value Value to set
   */
  set_value(section: string, key: string, value: unknown): void {
    if (!this.values.has(section)) {
      this.values.set(section, new Map());
    }
    this.values.get(section)!.set(key, value);
  }

  /**
   * Save config file to disk
   * @param path File path to save to
   */
  async save(path: string): Promise<void> {
    const content = serialize_config(this.values);
    await writeFile(path, content, "utf-8");
  }

  /**
   * Check if a section exists
   * @param section Section name
   * @returns True if section exists
   */
  has_section(section: string): boolean {
    return this.values.has(section);
  }

  /**
   * Check if a key exists in a section
   * @param section Section name
   * @param key Key name
   * @returns True if key exists in section
   */
  has_section_key(section: string, key: string): boolean {
    const sectionMap = this.values.get(section);
    if (!sectionMap) {
      return false;
    }
    return sectionMap.has(key);
  }

  /**
   * Clear all values
   */
  clear(): void {
    this.values.clear();
  }

  /**
   * Get all section names
   */
  get_sections(): string[] {
    return Array.from(this.values.keys());
  }

  /**
   * Get all keys in a section
   */
  get_section_keys(section: string): string[] {
    const sectionMap = this.values.get(section);
    if (!sectionMap) {
      return [];
    }
    return Array.from(sectionMap.keys());
  }

  /**
   * Encode config to text format
   */
  encode_to_text(): string {
    return serialize_config(this.values);
  }
}

