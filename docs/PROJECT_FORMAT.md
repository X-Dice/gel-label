# Project format v1

A `.gellabel.json` file is a UTF-8 JSON object with:

| Field | Content |
| --- | --- |
| `format` | Exactly `gellabel` |
| `version` | Exactly `1`; unknown versions are rejected |
| `image` | `data`: embedded PNG/JPEG/WebP base64 data URI; `width`, `height`: positive integer pixel dimensions; `name`: filename; `synthetic`: boolean |
| `annotations` | Array of at most 400 annotations |
| `style` | `fontSize`: 10–48; `color`, `background`: six-digit hex colors |

Each annotation has a unique string `id`, a `kind` (`lane`, `text`, `arrow`, `bracket`, `band`), a plain `text` string of at most 200 characters, and finite `x`, `y`, `x2`, `y2` coordinates. Names and IDs have bounded lengths. Unknown fields are discarded on import.

Coordinates are in source-image pixels, with `(0,0)` at the image's top-left. The SVG figure adds fixed paper margins: 92 px left, 98 px top, 50 px right, and 44 px bottom. Annotation coordinates are allowed from -82 to image width + 40 horizontally and -82 to image height + 32 vertically. Lane labels are placed at y = -26 by default and can be dragged horizontally within the image width. Brackets use x, y and x2, with their line horizontal; arrows use both endpoints.

External image URLs, SVG images, unsupported data URI types, duplicate IDs, malformed fields, excessive dimensions, and unsupported versions are rejected. The browser then decodes the image and checks its actual dimensions against the declared dimensions before replacing the session. Failed imports leave the current session intact.

The project includes image bytes and all annotations, but not undo history, UI language, guide visibility, or current selection. Nothing is sent to a server or written automatically. Save/download is explicit. Raster bytes are kept unchanged; exports composite annotations around/on that source image.

Examples live in `examples/`. The demo's `synthetic: true` watermark remains in rendered exports; this metadata is descriptive, not a tamper-proof authenticity mechanism.
