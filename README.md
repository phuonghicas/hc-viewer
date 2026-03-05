# HC Viewer SDK

A lightweight JavaScript SDK for embedding and controlling the HC 3D Viewer inside any web application.

The SDK mounts the viewer inside an iframe and provides a clean API for interacting with it, such as camera control, interaction control, and event listening.

## Installation

Install the package from npm:

```bash
npm install hc-viewer
```

or

```bash
yarn add hc-viewer
```

## Quick Start

```js
import { HcViewer } from "hc-viewer";

const viewer = new HcViewer({
  container: "#app",
  url: "<viewer-url>",
});

viewer.init();
viewer.render();
```

HTML container:

```html
<div id="app"></div>
```

## Viewer Application

The SDK does not include the 3D viewer itself.

Instead, it embeds an existing viewer application inside an iframe.

You must provide the viewer URL when creating the SDK instance.

Example:

```js
const viewer = new HcViewer({
  container: "#app",
  url: "http://localhost:3000/mainviewer",
});
```

### Running the Viewer Locally

If you do not already have a viewer application running, you can start the viewer locally.

Clone the viewer repository:

```bash
git clone --branch 3dviewer_SDK --single-branch https://git.anybim.vn/construxiv/cxv-3dviewer
```

Install dependencies:

```bash
npm install
```

Start the viewer:

```bash
npm run start
```

Once the viewer is running, open:

```text
http://localhost:3000
```

This will usually open the dashboard first, not the final viewer URL yet.

To get a usable viewer URL:

1. Open the dashboard at `http://localhost:3000`
2. Select the file you want to view
3. Wait until the file is cached/converted if it is not ready yet
4. When the app navigates to the `mainviewer` page, copy that final URL from the browser

Use that final `mainviewer` URL in the SDK configuration.


### Production Setup

In production environments, the viewer should be hosted on your own server.

Example:

```js
const viewer = new HcViewer({
  container: "#app",
  url: "https://viewer.example.com/mainviewer",
});
```

## Configuration

```ts
type HcViewerOptions = {
  container: HTMLElement | string;
  url: string;
  width?: string;
  height?: string;
  sandbox?: string;
  allowedOrigin?: string;
};
```

| Option | Description |
| --- | --- |
| `container` | DOM element or selector where the viewer iframe will be mounted |
| `url` | URL of the viewer application |
| `width` | iframe width (default `100%`) |
| `height` | iframe height (default `100%`) |
| `sandbox` | optional iframe sandbox attribute |
| `allowedOrigin` | restrict accepted `postMessage` origin |

## Viewer Lifecycle

Initialize viewer:

```js
viewer.init();
viewer.render();
```

Destroy viewer:

```js
viewer.destroy();
```

`destroy()` removes the iframe and all event listeners.

## Camera Controls

```js
viewer.camera.zoomIn(10);
viewer.camera.zoomOut(10);
viewer.camera.home();
```

| Method | Description |
| --- | --- |
| `zoomIn(percent)` | Zoom in the camera |
| `zoomOut(percent)` | Zoom out the camera |
| `home()` | Reset camera to default position |

## Interaction Controls

```js
viewer.interaction.enablePan();
viewer.interaction.disablePan();
```

| Method | Description |
| --- | --- |
| `enablePan()` | Enable pan interaction |
| `disablePan()` | Disable pan interaction |

## Events

The SDK exposes events using the pattern:

```js
viewer.<module>.on.<event>()
```

### Camera Events

```js
viewer.camera.on.home((payload) => {
  console.log("Home clicked", payload);
});
```

### Node Events

```js
viewer.node.on.select((payload) => {
  console.log("Node selected:", payload.nodeId);
});
```

### Interaction Events

```js
viewer.interaction.on.panChange((payload) => {
  console.log("Pan state:", payload.enabled);
});
```

### Event Payloads

| Event | Payload |
| --- | --- |
| `camera.home` | `{ timestamp: number }` |
| `node.select` | `{ nodeId: string, timestamp: number }` |
| `interaction.panChange` | `{ enabled: boolean }` |


## Example

A working example project is included in this repository:

```text
example/test-hc-viewer
```

Run the example:

```bash
cd example/test-hc-viewer
npm install
npm start
```

Open:

```text
http://localhost:5173
```

## Security

The SDK supports restricting message sources.

```js
allowedOrigin: "https://viewer.example.com";
```

Only messages from the specified origin will be accepted.

