# 3dviewer-sdk

A lightweight JavaScript SDK for embedding and controlling the **3D Viewer** inside any web application.

The SDK supports two main capabilities:

- Embed an existing 3D Viewer application inside an iframe
- Process files with an `upload -> convert -> open` flow

You can use the SDK in two modes:

1. **Direct viewer mode**: open an existing final viewer URL
2. **File pipeline mode**: upload a file, convert it, then open the result

## Installation

```bash
npm install 3dviewer-sdk
```

or

```bash
yarn add 3dviewer-sdk
```

## Quick Start

### 1) Direct Viewer Mode

Use this mode when you already have a final viewer URL.

```js
import { Viewer3D } from "3dviewer-sdk";

const viewer = new Viewer3D({
  container: "#app",
  url: "http://localhost:3000/mainviewer?fileList=...",
  allowedOrigin: "http://localhost:3000",
});

viewer.init();
viewer.render();
```

### 2) File Pipeline Mode

Use this mode when the SDK should handle:

- Upload file
- Request conversion
- Open viewer with converted result

```js
import { Viewer3D } from "3dviewer-sdk";

const viewer = new Viewer3D({
  container: "#app",
  baseUrl: "https://dev.3dviewer.anybim.vn",
  viewerPath: "/mainviewer",
  uploadPath: ".",
  allowedOrigin: "http://localhost:3000",
});

viewer.init();

const input = document.querySelector("#file-input");
input.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const prepared = await viewer.files.render(file);
    console.log("Viewer opened with:", prepared.url);
  } catch (error) {
    console.error("Failed to process file:", error);
  }
});
```

```html
<input id="file-input" type="file" />
<div id="app"></div>
```

### Render Priority (url + baseUrl)

You can pass both `url` and `baseUrl` at the same time.

`viewer.render(file?)` now works with this priority:

1. If `url` exists, render iframe directly from `url`
2. If `url` is missing, fallback to file pipeline (`upload -> convert -> open`)

## Viewer Application

This SDK does not include the viewer app itself.

You must run/deploy the viewer app separately.

Current SDK behavior:

- Conversion API host comes from `baseUrl` (default: `https://dev.3dviewer.anybim.vn`)
- Generated iframe URL uses viewer origin `http://localhost:3000` + `viewerPath`

## Configuration

```ts
type Viewer3DOptions = {
  container: HTMLElement | string;

  // Direct viewer mode
  url?: string;

  // File pipeline mode
  baseUrl?: string;
  viewerPath?: string;
  uploadPath?: string;
  file?: File;
  notify?: boolean | {
    success?: boolean;
    error?: boolean;
  };

  width?: string;
  height?: string;
  sandbox?: string;
  allowedOrigin?: string;
};
```

### Options

| Option | Description |
| --- | --- |
| `container` | DOM element or selector where iframe will be mounted |
| `url` | Viewer URL for direct viewer mode |
| `baseUrl` | Base API URL for upload/conversion |
| `viewerPath` | Viewer route path (default `/mainviewer`) |
| `uploadPath` | Upload path query passed to upload endpoint (default `.`) |
| `file` | Optional default file used by `viewer.files.*` |
| `notify` | Optional notification config |
| `width` | Iframe width (default `100%`) |
| `height` | Iframe height (default `100%`) |
| `sandbox` | Optional iframe sandbox attribute |
| `allowedOrigin` | Restrict accepted `postMessage` origin |

## Lifecycle

```js
viewer.init();
viewer.destroy();
```

If you provide `url`, you can still open manually:

```js
viewer.render();
viewer.open("http://localhost:3000/mainviewer?fileList=...");
```

## Files Module

The files module handles the `upload -> convert -> open` pipeline.

### Methods

```js
viewer.files.setConfig({
  baseUrl: "https://dev.3dviewer.anybim.vn",
  viewerPath: "/mainviewer",
  uploadPath: ".",
});

const state = viewer.files.getState();

await viewer.files.upload(file);           // upload only
const prepared1 = await viewer.files.convert(file);  // convert only
const prepared2 = await viewer.files.prepare(file);  // upload + convert
viewer.files.open(prepared2);              // open only
await viewer.files.render(file);           // upload + convert + open
```

### Single-shot Conversion

`viewer.files.convert()` sends conversion request **one time only**.

- If `cacheStatus === 2`: success
- If `cacheStatus !== 2`: fail immediately

No polling/retry is performed by SDK in current flow.

### Pipeline State

```ts
type LoadStage =
  | "idle"
  | "uploading"
  | "converting"
  | "rendering"
  | "completed"
  | "error";

type LoadStatePayload = {
  isLoading: boolean;
  stage: LoadStage;
  message?: string;
  elapsedMs?: number;
};
```

### Files Events

```js
viewer.files.on.state((payload) => console.log(payload.stage));
viewer.files.on.uploadStart((payload) => console.log(payload.fileName));
viewer.files.on.uploadSuccess((payload) => console.log(payload.baseFileId));
viewer.files.on.uploadError((payload) => console.error(payload.error));
viewer.files.on.conversionStart((payload) => console.log(payload.fileName));
viewer.files.on.conversionSuccess((payload) => console.log(payload.url));
viewer.files.on.conversionError((payload) => console.error(payload.error));
viewer.files.on.renderStart((payload) => console.log(payload.url));
viewer.files.on.renderSuccess((payload) => console.log(payload.url));
viewer.files.on.renderError((payload) => console.error(payload.error));
viewer.files.on.loadSuccess((payload) => console.log(payload.url));
viewer.files.on.loadError((payload) => console.error(payload.error));
```

## Viewer Controls

### Camera

```js
viewer.camera.zoomIn(10);
viewer.camera.zoomOut(10);
viewer.camera.home();
```

### Interaction

```js
viewer.interaction.enablePan();
viewer.interaction.disablePan();
viewer.interaction.select();
viewer.interaction.areaSelect();
viewer.interaction.orbit();
viewer.interaction.rotateZ();
viewer.interaction.walkThrough();
viewer.interaction.zoomWindow();
viewer.interaction.zoomFit();
```

`zoomWindow` switches to zoom-window operator mode.  
`zoomFit` triggers fit-to-model action.

### Toolbar Controls (Enable/Disable)

```js
// Disable all toolbar actions for 3D viewer
viewer.toolbar.disableAll3D();

// Re-enable toolbar actions for 3D viewer
viewer.toolbar.enableAll3D();

// Disable all toolbar actions for PDF viewer
viewer.toolbar.disableAllPdf();

// Re-enable toolbar actions for PDF viewer
viewer.toolbar.enableAllPdf();

// Disable a custom subset
viewer.toolbar.setDisabled3D(["home", "pan", "zoomIn"]);
viewer.toolbar.setDisabledPdf(["home", "next-page", "last-page"]);

// Clear only custom disabled list
viewer.toolbar.clearDisabled3D();
viewer.toolbar.clearDisabledPdf();
```

## Viewer Events

```js
viewer.camera.on.home((payload) => {
  console.log("Home clicked", payload);
});

viewer.node.on.select((payload) => {
  console.log("Node selected:", payload.nodeId);
});

viewer.interaction.on.panChange((payload) => {
  console.log("Pan enabled:", payload.enabled);
});
```

### Event Payloads

| Event | Payload |
| --- | --- |
| `camera.home` | `{ timestamp: number }` |
| `node.select` | `{ nodeId: string, timestamp: number }` |
| `interaction.panChange` | `{ enabled: boolean }` |

## Exported Types

```ts
import type {
  LoadStage,
  LoadStatePayload,
  PreparedViewerData,
  FilesConfig,
} from "3dviewer-sdk";
```

## Example Project

A working example is included at:

```text
example/test-3dviewer-sdk
```

Run:

```bash
cd example/test-3dviewer-sdk
npm install
npm start
```

Open:

```text
http://localhost:5173
```

## Security

Use `allowedOrigin` to restrict message source:

```js
const viewer = new Viewer3D({
  container: "#app",
  allowedOrigin: "http://localhost:3000",
});
```

Only messages from the specified origin will be processed.

## Build & Publish

Detailed guide: [BUILD_AND_PUBLISH.md](./BUILD_AND_PUBLISH.md)

## Notes

- Framework agnostic
- Viewer app is not bundled with SDK
- File pipeline requires conversion APIs to be available
