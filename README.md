# HC Viewer SDK

HC Viewer SDK is a lightweight iframe-based integration library that allows host applications to communicate with the HC 3D Viewer via `postMessage`.

It provides:

- Render 3D Viewer inside an iframe
- File upload/convert/query flow before opening viewer
- Zoom control
- Home control
- Pan mode toggle
- Node selection event
- Typed event system
- Origin validation

---

## Installation

```bash
npm install hc-viewer
```

---

## Basic Usage

```ts
import { HcViewer } from "hc-viewer";

const viewer = new HcViewer({
  container: "#app",
  file,
  baseUrl: "http://localhost:3000",
  conversion: {
    async upload(file, baseUrl) {
      // upload file to your server
      return { fileName: file.name };
    },
    async convert(uploadResult, baseUrl) {
      // call conversion service
      return { ...uploadResult, query: "fileList=..." };
    },
    async getQuery(convertResult) {
      // return query string part for /mainviewer?...
      return convertResult.query;
    }
  }
});

await viewer.render();
```

---

## Render Flow

When `render()` is called, SDK runs:

1. `upload(file, baseUrl)`
2. `convert(uploadResult, baseUrl)`
3. `getQuery(convertResult, baseUrl)`
4. Build iframe URL: `${baseUrl}/mainviewer?${query}`

`baseUrl`:
- Uses the provided value when available
- Defaults to `http://localhost:3000` when omitted

---

## Zoom Control

```ts
viewer.zoomIn(20);
viewer.zoomOut(10);
```

---

## Home Control

```ts
viewer.goHome();
```

Listen when user clicks Home inside Viewer:

```ts
viewer.on("camera:home", payload => {
  console.log("Home clicked:", payload.timestamp);
});
```

---

## Pan Mode

```ts
viewer.enablePan();
viewer.disablePan();
```

Listen for changes from Viewer:

```ts
viewer.on("interaction:pan-change", payload => {
  console.log("Pan enabled:", payload.enabled);
});
```

---

## Node Selection

```ts
viewer.on("node:select", payload => {
  console.log("Selected node:", payload.nodeId);
});
```

---

## Security

Set `allowedOrigin` to validate incoming `postMessage`:

```ts
allowedOrigin: "https://your-viewer-domain.com";
```

---

## Destroy Viewer

```ts
viewer.destroy();
```

---

## Architecture

Communication is based on `window.postMessage`:

Host App <-> SDK <-> 3D Viewer (iframe)

Message sources:
- `HC_SDK`
- `HC_VIEWER`
