# Viewer App Setup

## Viewer requirement

The SDK does not include the viewer application. You must run or deploy the viewer separately.

If you want the full local setup including SDK repo and test app, also see:

- [Project Setup](/getting-started/project-setup)

Current SDK behavior:

- Conversion API host uses `baseUrl` and defaults to `https://dev.3dviewer.anybim.vn`.
- Final iframe URL uses viewer origin `http://localhost:3000` plus `viewerPath`.

## Run the viewer locally

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

In most cases, the app opens the dashboard first, not the final `mainviewer` URL yet.

To get a usable direct-view URL:

1. Open the dashboard at `http://localhost:3000`.
2. Select the file you want to view.
3. Wait until conversion or caching completes if needed.
4. When the app navigates to `mainviewer`, copy that final browser URL.

## Production setup

In production, host the viewer app on your own domain and set `allowedOrigin` to that exact origin.

```js
import { Viewer3D } from "3dviewer-sdk";

const viewer = new Viewer3D({
  container: "#app",
  url: "https://viewer.example.com/mainviewer?fileList=...",
  allowedOrigin: "https://viewer.example.com",
});
```
