# Quick Start

## Direct viewer mode

Use this when you already have a final viewer URL.

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

## File pipeline mode

Use this when the SDK should handle upload and conversion.

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

  const prepared = await viewer.files.render(file);
  console.log(prepared.url);
});
```

## Render priority

When calling `viewer.render(file?)`:

1. If `url` exists, the iframe renders directly from `url`.
2. If `url` is missing, the SDK falls back to `upload -> convert -> open`.
