# 3dviewer-sdk

A lightweight JavaScript SDK for embedding and controlling the **3D Viewer** in any web application.

The SDK supports two usage modes:

1. **Direct viewer mode**: open an existing viewer URL.
2. **File pipeline mode**: upload a file, request conversion, then open the result.

## Installation

```bash
npm install 3dviewer-sdk
```

or

```bash
yarn add 3dviewer-sdk
```

## Viewer App Requirement

This SDK does not bundle the viewer application.
You must run/deploy your 3dviewer app separately.

Current behavior:

- Conversion API host uses `baseUrl` (default: `https://dev.3dviewer.anybim.vn`).
- Final iframe URL always uses viewer origin `http://localhost:3000` + `viewerPath`.

### Running the Viewer Locally

If you do not already have a viewer app running, start it locally:

```bash
git clone --branch 3dviewer_SDK --single-branch https://git.anybim.vn/construxiv/cxv-3dviewer
cd cxv-3dviewer
npm install
npm run start
```

Then open:

```text
http://localhost:3000
```

In most cases, this opens the dashboard first, not the final `mainviewer` URL yet.

To get a usable viewer URL:

1. Open dashboard at `http://localhost:3000`.
2. Select the file you want to view.
3. Wait until conversion/caching is completed (if required).
4. When the app navigates to `mainviewer`, copy that final URL from browser.

Use that final `mainviewer` URL for direct viewer mode (`url` option).

### Production Setup

In production, host the viewer app on your own domain/server.

Example:

```js
const viewer = new Viewer3D({
  container: "#app",
  url: "https://viewer.example.com/mainviewer?fileList=...",
  allowedOrigin: "https://viewer.example.com",
});
```

## Quick Start

### 1) Direct Viewer Mode

Use when you already have a final viewer URL.

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

HTML container:

```html
<div id="app"></div>
```

### 2) File Pipeline Mode

Use when SDK should handle upload + conversion.

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

## Render Priority (`url` + `baseUrl`)

`viewer.render(file?)` uses this priority:

1. If `url` exists, render iframe directly from `url`.
2. If `url` is missing, fallback to file pipeline (`upload -> convert -> open`).

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

  width?: string;
  height?: string;
  sandbox?: string;
  allowedOrigin?: string;
};
```

| Option | Description |
| --- | --- |
| `container` | DOM element or selector where iframe is mounted |
| `url` | Final viewer URL for direct mode |
| `baseUrl` | Conversion API base URL |
| `viewerPath` | Viewer route path (default `/mainviewer`) |
| `uploadPath` | Upload path query passed to upload endpoint (default `.`) |
| `file` | Optional default file used by `viewer.files.*` |
| `width` | Iframe width (default `100%`) |
| `height` | Iframe height (default `100%`) |
| `sandbox` | Optional iframe sandbox attribute |
| `allowedOrigin` | Restrict accepted `postMessage` origin |

## Lifecycle

```js
viewer.init();
viewer.destroy();
```

`destroy()` removes the mounted iframe and unregisters SDK message listeners.

Manual open:

```js
viewer.open("http://localhost:3000/mainviewer?fileList=...");
```

## Files Module

Handles upload/conversion/open pipeline.

```js
viewer.files.setConfig({
  baseUrl: "https://dev.3dviewer.anybim.vn",
  viewerPath: "/mainviewer",
  uploadPath: ".",
});

const state = viewer.files.getState();

await viewer.files.upload(file);          // upload only
const prepared1 = await viewer.files.convert(file); // convert only
const prepared2 = await viewer.files.prepare(file); // upload + convert
viewer.files.open(prepared2);             // open only
await viewer.files.render(file);          // upload + convert + open
```

Single-shot conversion:

- `viewer.files.convert()` sends one conversion request.
- Success only when response `cacheStatus === 2`.
- No SDK polling/retry in current flow.

Files events:

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

## Camera Module

```js
viewer.camera.zoomIn(10);
viewer.camera.zoomOut(10);
viewer.camera.home();

viewer.camera.on.home((payload) => {
  console.log("Home clicked", payload.timestamp);
});
```

## Markup Module (3D)

`viewer.markup` currently documents and supports the 3D markup bridge.

### Drawing actions

```js
viewer.markup.drawLine();
viewer.markup.drawArrow();
viewer.markup.drawCircle();
viewer.markup.drawEllipse();
viewer.markup.drawRectangle();
viewer.markup.drawPolygon();
viewer.markup.drawPolyline();
viewer.markup.drawTextBox();
viewer.markup.drawNote();
viewer.markup.drawCallout();
viewer.markup.drawCloud();
viewer.markup.drawFreehand();
```

### Save, cancel, and list markups

```js
await viewer.markup.save();
await viewer.markup.cancel();

const markups = await viewer.markup.getList();
console.log(markups);
```

Timeout options are supported for request-response calls:

```js
await viewer.markup.save({ timeoutMs: 15000 });
await viewer.markup.cancel({ timeoutMs: 15000 });
const markups = await viewer.markup.getList({ timeoutMs: 15000 });
```

Returned list shape:

```ts
type MarkupListItem = {
  id: string;
  viewId: string;
  viewName?: string;
  title: string;
  type: string;
  shapeName?: string;
  createdDate?: string;
  modifiedDate?: string;
  createdBy?: string;
  lastModifiedBy?: string;
};
```

Notes:

- Current SDK markup flow is intended for 3D viewer markup.
- PDF markup is not documented as a supported SDK flow yet.
- `save()`, `cancel()`, and `getList()` use viewer replies internally and resolve/reject as promises.

## Interaction Module

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

viewer.interaction.drawModeShaded();
viewer.interaction.drawModeWireframe();
viewer.interaction.drawModeHiddenLine();
viewer.interaction.drawModeShadedWire();
viewer.interaction.drawModeXRay();
viewer.interaction.drawModeGhosting();

viewer.interaction.explode(0.5);
viewer.interaction.explodeOff();

viewer.interaction.on.panChange((payload) => {
  console.log("Pan enabled:", payload.enabled);
});
```

## Toolbar Module

### Enable/disable toolbar operators

```js
viewer.toolbar.disableAll3D();
viewer.toolbar.enableAll3D();
viewer.toolbar.disableAllPdf();
viewer.toolbar.enableAllPdf();

viewer.toolbar.setDisabled3D(["home", "pan", "zoomIn"]);
viewer.toolbar.setDisabledPdf(["home", "next-page", "last-page"]);

viewer.toolbar.clearDisabled3D();
viewer.toolbar.clearDisabledPdf();
```

Note:
- These APIs require viewer-side support for `viewer-toolbar-config` messages.
- If your 3dviewer build has disabled/removed that handler, these methods will not have visible effect.

### Open/close panels (modals)

```js
viewer.toolbar.openClippingPlanes();
viewer.toolbar.closeClippingPlanes();

viewer.toolbar.openSetting();
viewer.toolbar.closeSetting();
viewer.toolbar.openSetting3D();
viewer.toolbar.closeSetting3D();
viewer.toolbar.openSettingPdf();
viewer.toolbar.closeSettingPdf();

viewer.toolbar.openStatesObjects();
viewer.toolbar.closeStatesObjects();

viewer.toolbar.openLinkedObjects();
viewer.toolbar.closeLinkedObjects();

viewer.toolbar.openModelTree();
viewer.toolbar.closeModelTree();

viewer.toolbar.openObjectProperties();
viewer.toolbar.closeObjectProperties();

viewer.toolbar.openSheets();
viewer.toolbar.closeSheets();
```

### Sheets actions

```js
const sheets = await viewer.toolbar.getSheets();
console.log(sheets); // [{ id, name, is3D?, viewId? }, ...]

viewer.toolbar.applySheet(sheets[0].id);
viewer.toolbar.applySheet("12345");
```

`getSheets` supports timeout option:

```js
const sheets = await viewer.toolbar.getSheets({ timeoutMs: 15000 });
```

### Cutting plane actions

```js
viewer.toolbar.cuttingCloseSections();
viewer.toolbar.cuttingMultipleSides();
viewer.toolbar.cuttingToggleSelection();
viewer.toolbar.cuttingTogglePlanes();

viewer.toolbar.cuttingPlaneX();
viewer.toolbar.cuttingPlaneY();
viewer.toolbar.cuttingPlaneZ();
viewer.toolbar.cuttingPlaneBox();
viewer.toolbar.cuttingRotateBox();
viewer.toolbar.cuttingReversePlaneX();
viewer.toolbar.cuttingReversePlaneY();
viewer.toolbar.cuttingReversePlaneZ();
```

## Model Tree Module

```js
viewer.modelTree.open();
viewer.modelTree.selectNode("123");

const nodeIds = await viewer.modelTree.getNodeIds();
console.log(nodeIds);

const allNodeIds = await viewer.modelTree.getNodeIds({ onlyRealNodes: false, timeoutMs: 15000 });
```

## Node Events

```js
viewer.node.on.select((payload) => {
  console.log("Node selected:", payload.nodeId);
});
```

### Event Payloads

| Event | Payload |
| --- | --- |
| `camera.home` | `{ timestamp: number }` |
| `node.select` | `{ nodeId: string, timestamp: number }` |
| `interaction.panChange` | `{ enabled: boolean }` |
| `markup.save` | Promise result from `viewer.markup.save()` |
| `markup.cancel` | Promise result from `viewer.markup.cancel()` |
| `markup.list` | Promise result from `viewer.markup.getList()` |

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

### Quick Start

Example app path:

```text
example/test-3dviewer-sdk
```

#### Prerequisites

- **Node.js**: v14 or higher
- **npm**: v6 or higher (or yarn)

#### Installation & Run

1. **Navigate to the example directory:**

```bash
cd example/test-3dviewer-sdk
```

2. **Install dependencies:**

```bash
npm install
```

This installs webpack, webpack-cli, webpack-dev-server, and the 3dviewer-sdk from the local `sdk/` folder.

3. **Start the development server:**

```bash
npm start
```

The dev server will automatically open your browser at:

```text
http://localhost:5173
```

#### What You'll See

The example app is a full testing interface with:

- **File Upload Section**: Choose a file to upload and process
- **Upload/Convert/Open Controls**: Step-by-step file pipeline management
- **Camera Controls**: Zoom, home, and view navigation
- **Interaction Modes**: Pan, select, orbit, walk-through, etc.
- **Drawing Modes**: Shaded, wireframe, hidden line, X-ray, ghosting, etc.
- **Toolbar Controls**: Clipping planes, settings, model tree, object properties
- **Cutting Plane Tools**: 3D cutting and sectioning

#### Example Features to Test

1. **Direct Viewer Mode** (if you have a viewer URL):
   - Enter a valid viewer URL in the interface
   - Click "Open" to render the viewer

2. **File Pipeline Mode** (upload and convert):
   - Select a file using the file input
   - Click "Upload" to upload the file
   - Click "Convert" to convert it
   - Click "Open" to view the result

3. **Camera & Interaction**:
   - Use the camera buttons (zoom in/out, home)
   - Test interaction modes (pan, select, orbit, etc.)
   - Switch between different drawing modes

#### Troubleshooting

- **Port already in use**: The dev server uses port `5173`. If it's in use, webpack will try the next available port.
- **Module not found errors**: Make sure you've run `npm install` in both the example directory and the root `sdk/` directory.
- **Viewer not loading**: Ensure a viewer app is running and accessible (see "Running the Viewer Locally" section above).
- **Changes not reflecting**: The dev server has hot module replacement enabled. If changes don't appear, try a hard refresh (Ctrl+Shift+R or Cmd+Shift+R).

## Security

Use `allowedOrigin` to restrict message source:

```js
const viewer = new Viewer3D({
  container: "#app",
  allowedOrigin: "http://localhost:3000",
});
```

## Build & Publish

Detailed guide: [BUILD_AND_PUBLISH.md](./BUILD_AND_PUBLISH.md)

## Web Docs

A VitePress-based documentation site now lives in `docs/` so the markdown structure can evolve into a developer portal style similar to Procore.

Run locally:

```bash
cd cxv-3dviewer-sdk
npm install
npm run docs:dev
```

## Notes

- Framework agnostic.
- Viewer app is not bundled with SDK.
- File pipeline requires conversion APIs to be available.
