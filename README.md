# godot-export-presets

Read and write Godot export_presets.cfg files.

This library provides a simple way to programmatically manage Godot export presets. It handles parsing the config file format, merging presets, and includes base presets for common platforms.

The parsing and serialization logic is based on Godot's source code, specifically the `ConfigFile`, `VariantParser`, and `VariantWriter` implementations from the Godot engine repository. This attempts to ensure compatibility with Godot's native export preset format.

## Installation

```bash
npm install godot-export-presets
```

Requires Node.js 18 or higher.

## Quick Start

```typescript
import { loadExportPresets, findPreset, saveExportPresets } from 'godot-export-presets';

// Load existing presets
const presets = await loadExportPresets('./export_presets.cfg');

// Find preset by platform name
const androidPreset = findPreset(presets, { platform: 'Android' });
if (androidPreset) {
  androidPreset.export_path = 'game.apk';
}

// Save
await saveExportPresets('./export_presets.cfg', presets);
```

## Examples

### Basic Reading and Writing

Load a file, find a preset by name, make changes, and save:

```typescript
import { loadExportPresets, findPreset, saveExportPresets } from 'godot-export-presets';

const presets = await loadExportPresets('./export_presets.cfg');
console.log(`Found ${presets.presets.length} presets`);

// Find preset by platform (case-insensitive)
const androidPreset = findPreset(presets, { platform: 'android' });
if (androidPreset) {
  androidPreset.export_path = 'game.apk';
}

// Or find by preset name
const iosPreset = findPreset(presets, { name: 'iOS' });
if (iosPreset) {
  iosPreset.export_path = 'game.ipa';
}

await saveExportPresets('./export_presets.cfg', presets);
```

### Using Base Presets

The library includes base presets for Android and iOS on Godot 3.x and 4.x:

```typescript
import { getBasePreset, getMajorVersion } from 'godot-export-presets';

// Get base preset for Android (Godot 4.x)
const baseAndroid = getBasePreset('Android', 4);

// Extract version from string
const version = getMajorVersion('4.3.2'); // returns 4
const baseForVersion = getBasePreset('iOS', version);
```

## API Overview

Main functions:

- `loadExportPresets(filePath)` - Load presets from file
- `saveExportPresets(filePath, presets)` - Save presets to file
- `parseExportPresets(content)` - Parse from string
- `serializeExportPresets(presets)` - Serialize to string
- `findPreset(presets, criteria)` - Find preset by platform/name/index
- `getPreset(presets, index)` - Get preset by index
- `setPreset(presets, preset, index?)` - Add or update preset
- `removePreset(presets, index)` - Remove preset
- `mergePresets(...presets)` - Merge multiple presets
- `getBasePreset(platform, version)` - Get base preset
- `getMajorVersion(version)` - Extract major version from string

For full TypeScript types and API details, see the type definitions in `dist/index.d.ts`.

## Implementation Notes

This library is based on Godot's source code. The parsing logic follows Godot's `VariantParser` implementation, and the serialization follows `VariantWriter` and `String::property_name_encode`. The base presets are extracted from real Godot export configurations.

This implementation was created with tool assistance using Cursor and Claude, porting Godot's C++ logic to TypeScript while maintaining compatibility with the original format.

Key Godot source files referenced:
- `core/io/config_file.cpp` - ConfigFile parsing and writing
- `core/variant/variant_parser.cpp` - Variant parsing logic
- `core/string/ustring.cpp` - String encoding for keys
- `editor/export/editor_export.cpp` - Export preset structure

## License

MIT

