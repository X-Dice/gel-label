# Verification status — v0.1.0

Checked locally on 2026-10-30 using Node.js 24.18.1 on macOS arm64.

## Passed

- 14 automated tests covering lane layout, Excel/Unicode label parsing, bounded coordinates, endpoint-preserving movement, independent history snapshots, divergent undo/redo, JSON roundtrip, invalid imports, size limits, XML escaping, embedded image bytes, demo watermarks, and raster output.
- TypeScript strict type checking and production Vite build, locally and on GitHub Actions (Ubuntu).
- GitHub Pages deployment succeeded after the user enabled Pages and the failed job was rerun: https://github.com/X-Dice/gel-label/actions/runs/41061710986 . The deploy log returned https://x-dice.github.io/gel-label/ as the environment URL.
- GitHub [Check and build](https://github.com/X-Dice/gel-label/actions/runs/41061448270) and [Publish preview release](https://github.com/X-Dice/gel-label/actions/runs/41061448339) workflows completed successfully. The v0.1.0 prerelease contains offline HTML and a SHA-256 checksum.
- Standalone HTML generation with CSS and JavaScript embedded, no external application scripts or styles; extracted module syntax checked by Node.js.
- Independent SVG rasterization using resvg: correct output dimensions, exact source image pixel positions, and correct transparent-image compositing onto the chosen paper color.
- Published offline HTML downloaded from the release URL; SHA-256 verification passed, and the file is byte-for-byte identical to the local build.
- Exported synthetic figure visually inspected. The example and animation use the actual project SVG renderer.

## Not yet verified

- Real browser interactions: image chooser/drop, Excel pasting, drag gestures, keyboard navigation, PNG download, and JSON project reopening.
- Browser decoding of JPEG/WebP and corrupt image payloads; error paths are implemented but have not been exercised in a browser.
- Browser network behavior during interaction. Source contains no upload service or analytics; this has not been verified with a network trace.
- Cross-browser behavior, narrow-screen interaction, accessibility with assistive technology, and memory behavior at maximum image size.
- Browser execution from `file://` of the offline HTML.
- Real browser acceptance of the published site remains unverified: the browser origin gate also denied access to https://x-dice.github.io after successful deployment.


The browser tool denied permission for both the local preview origin and GitHub. No alternate browser route, token extraction, or authentication workaround was used. The user subsequently created the public X-Dice/gel-label repository. The connector confirmed write access; 43 project files were committed to main at `ba865896b0ba6a24ae4ec2e15ab022532751df74`. Source publication and the preview release succeeded. The GitHub CLI is not logged in.

There is no real UI screenshot or browser recording. `export-example.png` is a real renderer output, and `export-walkthrough.gif` is a sequence of renderer outputs, explicitly labeled as such.

## Browser acceptance checklist

Before announcing a stable release:

1. Open the demo in Chrome and Safari (then Firefox/Edge where available).
2. Load a PNG, JPEG, and WebP; include a transparent PNG. Verify no upload requests.
3. Paste 6 labels containing Chinese and `& < > "`, apply them, and drag a lane.
4. Add text, an arrow, a bracket, and a manual band-size label. Edit both endpoints where available.
5. Undo/redo each operation; delete an item; nudge with arrow keys and Shift.
6. Export PNG and SVG. Open both and confirm image placement, labels, and absence of guides/selection markers.
7. Save JSON, reload the app, and reopen the project. Confirm the image and annotations match.
8. Try malformed JSON, unsupported versions, remote-image data, corrupt images, mismatched dimensions, excessive dimensions and size limits. The session must remain intact on failure.
9. Run the standalone HTML with networking disabled and repeat the main flow.
10. Resize to a narrow screen, confirm the hint and horizontal scrolling, and check keyboard focus visibility.

## Deployment history

The first Pages attempt failed because Pages was disabled. The user enabled it, and the rerun succeeded. Browser interaction checks and real UI screenshots/recordings still need an authorized browser session. Repository About metadata (description, homepage, topics) also remains unapplied because the available connector has no repository-settings mutation tool.
