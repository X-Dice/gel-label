<p align="center"><strong>G E L L A B E L</strong></p>
<h1 align="center">From gel to figure.</h1>
<p align="center">Label gel images in your browser. No installation. No uploads.</p>
<p align="center"><a href="README.zh-CN.md">简体中文</a> · <a href="GelLabel-offline.html">Offline app</a> · <a href="#quick-start">Quick start</a> · <a href="CONTRIBUTING.md">Contribute</a></p>

![Example figure exported by GelLabel. This is synthetic data.](docs/export-example.png)

**Paste a column of lane names from Excel, drag them into place, and export a figure you can still edit.** GelLabel is a small, free tool for students, iGEM teams, and anyone labeling their next gel image.

> This is the v0.1.0 preview. Browser acceptance, live demo deployment, and release downloads are **not yet verified**. See [verification status](docs/VERIFICATION.md).

## Quick start

1. Download [`GelLabel-offline.html`](GelLabel-offline.html) and open it in a modern desktop browser. No server or installation is needed. If viewing on GitHub, use **Download raw file**.
2. Use **Try sample**, or open a PNG, JPEG, or WebP. Paste one lane name per line and click **Apply labels**.
3. Drag labels, add arrows or group brackets, then export **PNG**, **SVG**, or **Save project** to keep editing later.

The app starts with a clearly marked synthetic example. You can also open [`examples/demo.gellabel.json`](examples/demo.gellabel.json), or try [`examples/synthetic-gel.png`](examples/synthetic-gel.png) with [`examples/labels.tsv`](examples/labels.tsv).

## A small toolkit, on purpose

| Task | What you get |
| --- | --- |
| Label lanes | 1–40 evenly spaced labels, or paste an Excel column; drag each label independently |
| Annotate | Text, arrows, group brackets, and manually entered band-size labels |
| Adjust | Font size, label color, paper color; optional lane guides |
| Export | A self-contained SVG with the original image embedded, or PNG up to 2× resolution |
| Keep working | Versioned JSON project files containing the image and all annotations |
| Correct mistakes | Undo/redo, delete, keyboard nudging, and Escape to cancel |
| Switch language | English / 简体中文, with no reload |

### Export walkthrough

![Three stages: original synthetic gel, lane labels, completed figure. This animation shows renderer output, not a browser recording.](docs/export-walkthrough.gif)

This animation uses the actual SVG renderer at three annotation stages. It is **not** a recording of browser interactions.

## Your image stays yours

Processing happens in browser memory. There is no backend, telemetry, cloud storage, or file upload. Image file bytes are embedded unchanged in the image layer; annotations are a separate layer. The original file on disk is never overwritten.

Save a project before closing the tab: there is no automatic storage. A project file contains the source image, so share it only when you intend to share that image. External links and the initial website load still use the network; the downloaded offline HTML has all application code embedded.

## What it does not do

GelLabel does not detect bands, quantify intensity, calibrate molecular weight, or alter the gel pixels. Band-size labels are text you enter, **not measurements**. The synthetic demo watermark is kept in exports. For quantitative analysis, use a dedicated analysis tool.

## Limits and shortcuts

- Input images: PNG / JPEG / WebP, up to **20 MB**, **24 megapixels**, and **16,000 px per side**. TIFF and proprietary gel files are not supported.
- Projects: JSON up to **30 MB**, 400 annotations, and the same image limits. Import checks format version, field types, coordinates, image data, and decoded dimensions.
- PNG export: up to **2×**, capped at **48 megapixels** and **16,000 px per side** to limit memory use. SVG keeps original coordinates and image resolution. Large files may still exceed your browser's available memory.
- Long labels may need a smaller font or manual repositioning. Lane labels move horizontally; the side panel can edit other annotation coordinates and endpoints.
- Drag labels to move. **Arrow keys** nudge by 1 px; **Shift + arrow** by 10 px. **⌘/Ctrl Z** undoes; **⌘/Ctrl Shift Z** or **Ctrl Y** redoes. **Delete/Backspace** removes the selected annotation. **Escape** cancels placement or a drag.
- Best on desktop or tablet. Small screens keep a horizontally scrollable workspace.
- Modern browsers are the target. Real browser compatibility has not yet been verified; see [verification status](docs/VERIFICATION.md).

## Develop

Node.js **22.12+** or **24 LTS** and npm:

```sh
npm ci
npm run dev
```

```sh
npm test          # model, history, project validation, and raster export tests
npm run build     # TypeScript + Vite + standalone offline HTML
npm run examples  # regenerate synthetic examples and renderer snapshots
```

The build outputs `dist/index.html` and `dist/GelLabel-offline.html`. No runtime dependencies or external fonts are required. The root offline file is a release snapshot; regenerate it with `npm run package` after changing the source.

- `src/model.ts`: project format, coordinate transforms, history, validation, SVG rendering.
- `src/main.ts`: editor interactions, image loading, and downloads.
- `docs/PROJECT_FORMAT.md`: data format and import behavior.

## Publish your own copy

Fork or create a public repository, push the source, and choose **Settings → Pages → Source → GitHub Actions**. The included workflows test, build, and deploy the demo on pushes to `main`.

For the intended `X-Dice` account, `npm run publish:github` provides an optional GitHub CLI publishing helper. It checks your account, refuses to overwrite an existing remote, runs checks, creates a public repository, enables Pages, and prepares v0.1.0. It requires an existing GitHub CLI login. See [publishing notes](docs/PUBLISHING.md).

## Contributing

Small, focused improvements are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md). If this saves you a few minutes, a star helps other people find it.

Built independently. Related projects include [Slots Gel Annotator](https://github.com/billy-ngo/slots-gel-annotator) and [Gelutils](https://github.com/scholer/gelutils); no source code or assets were copied from them.

## License

[MIT](LICENSE). All included gel examples are generated synthetic data.
