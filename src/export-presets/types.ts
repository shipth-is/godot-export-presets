/**
 * Types for Godot export presets
 */

export interface ExportPreset {
  name: string;
  platform: string;
  runnable: boolean;
  dedicated_server?: boolean;
  custom_features?: string;
  export_filter?: string;
  include_filter?: string;
  exclude_filter?: string;
  export_path?: string;
  encryption_include_filters?: string;
  encryption_exclude_filters?: string;
  encrypt_pck?: boolean;
  encrypt_directory?: boolean;
  script_export_mode?: number;
  [key: string]: unknown;
  options?: PresetOptions;
}

export type PresetOptions = Record<string, unknown>;

export interface ExportPresetsFile {
  presets: ExportPreset[];
}

export interface FindPresetCriteria {
  name?: string;
  platform?: string;
  index?: number;
}

