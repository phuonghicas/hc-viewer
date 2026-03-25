# File Pipeline Mode

## When to use it

Use file pipeline mode when end users upload new files and the SDK should manage the conversion flow.

## Flow

```text
upload -> convert -> open
```

## Example

```js
const viewer = new Viewer3D({
  container: "#app",
  baseUrl: "https://dev.3dviewer.anybim.vn",
  viewerPath: "/mainviewer",
  uploadPath: ".",
  allowedOrigin: "http://localhost:3000",
});

viewer.init();

await viewer.files.upload(file);
const prepared = await viewer.files.convert(file);
viewer.files.open(prepared);
```

## Single-shot conversion

`viewer.files.convert()` only sends one conversion request. The SDK treats the flow as successful only when the response is ready after that request. No polling or retry is built into `convert()`.

## State tracking

Use `viewer.files.on.state(...)` when you want to show upload, conversion, and open status to the user.
