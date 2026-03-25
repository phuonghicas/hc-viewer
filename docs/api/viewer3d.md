# Viewer3D

## Constructor options

```ts
type Viewer3DOptions = {
  container: HTMLElement | string;
  url?: string;
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

## Option notes

- `container`: iframe mount point.
- `url`: final viewer URL for direct mode.
- `baseUrl`: conversion API base URL.
- `viewerPath`: viewer route path, default `/mainviewer`.
- `uploadPath`: upload path query, default `.`.
- `file`: optional default file for file methods.
- `allowedOrigin`: restricts accepted `postMessage` origin.

## Lifecycle

```js
viewer.init();
viewer.render();
viewer.destroy();
```

`destroy()` removes the mounted iframe and unregisters SDK message listeners.

## Helpers

```js
viewer.getOptions();
viewer.patchOptions({ file });
viewer.getUrl();
viewer.open(url);
```
