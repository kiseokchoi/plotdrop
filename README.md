# PlotSift

**English** | [한국어](README.ko.md)

PlotSift is a local-first graph digitizer for recovering data points and Y error bars from scientific figures. It combines manual point picking, color-based extraction, brush-restricted extraction, multiple data sheets, and spreadsheet-style editing in one application.

> Research preview: extracted values are estimates reconstructed from an image, not the original source data. Always verify axis calibration and the resulting values before using them in an analysis.

## Try it now

[Open the PlotSift web app](https://kiseokchoi.github.io/plotsift/) — no installation required. Images and extracted data are processed entirely on your device.

## Web app and standalone app

- **Web app/PWA:** The easiest way to try PlotSift. It can be installed from the browser and opened in its own window. After the first visit, it can also work offline.
- **Standalone:** A desktop build for users who prefer fully offline use and the operating system's native save dialog.

Both versions share the same interface and extraction engine. Neither version uploads graph images or extracted data to an external server.

PlotSift follows the operating system or browser language: Korean systems use Korean, while other systems use English. You can override this at any time with **Auto / 한국어 / English** in the language menu. The preference is remembered for future sessions.

## Build the standalone app

Building the macOS application requires Node.js 22 or later, Rust stable, and the Xcode Command Line Tools.

```sh
npm ci
npm run standalone:dmg
```

To build only the application bundle, use `npm run standalone:build`. The generated application and disk image are placed in:

```text
src-tauri/target/release/bundle/macos/PlotSift.app
src-tauri/target/release/bundle/dmg/PlotSift_0.1.0_aarch64.dmg
```

To run the standalone development window:

```sh
npm run standalone:dev
```

If the Rust command is unavailable, reopen the terminal or load the Rust environment in the current shell:

```sh
source "$HOME/.cargo/env"
```

Public test builds that are not signed and notarized with an Apple Developer certificate may trigger a macOS warning the first time they are opened. In Finder, right-click the application and select **Open**. Apple Developer signing and notarization are recommended for a trusted public release.

## Run locally in a browser

```sh
npm ci
npm run dev
```

Then open `http://localhost:3000`. On macOS, you can also double-click `PlotSift.command` to start the local browser version.

To build and preview the installable PWA locally:

```sh
npm run web:build
npm run web:preview
```

The PWA output is generated in the `web-dist` directory.

## How to use PlotSift

1. Drop a graph image into the app or select **Open image**.
2. Click the X-axis minimum, X-axis maximum, Y-axis minimum, and Y-axis maximum positions in that order.
3. Confirm the axis values and linear/logarithmic scales, then select **Start extraction**.
4. Click normally to record data points. Click an existing point to select its table cell, or double-click it to edit the Y value. Use `Alt+click` to force-add a new point near an existing one.
5. Hold `Ctrl` or `⌘` and click an error-bar endpoint. PlotSift records its Y difference from the selected point as `y_error`. Selecting a row first lets you add or replace that row's error bar later.
6. In the table, `Shift+click` selects a range and `Ctrl/⌘+click` adds individual cells. Press `Backspace` or `Delete` to remove selected data rows. Press `Enter` or double-click to edit X, Y, or error values.
7. For automatic color extraction, use **Pick from image** to choose a color. Search the **Full image** or restrict extraction to a **Brush area**. Adaptive density handles tightly packed and widely spaced regions differently.
8. Use **＋ Sheet** to extract another series from the same image. Points, error bars, and selected colors are stored independently for each sheet.
9. Choose a space, comma, tab, or semicolon export delimiter. Space-delimited data is saved as a gnuplot-friendly `.dat` file, tab-delimited data as `.tsv`, and the other formats as `.csv`.

## AI-assisted development

PlotSift was developed with code-generation assistance from OpenAI GPT/Codex, guided by the researcher's feature design, usability decisions, testing, and revision instructions. This does not add any licensing condition; distribution of this repository is governed by the Apache License 2.0.

## License

Copyright 2026 K. S. Choi.

Licensed under the [Apache License 2.0](LICENSE). Third-party components remain subject to their respective licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
