# Direct Viewer Mode

## When to use it

Use direct viewer mode when another system already produces the final `mainviewer` URL and you only need embedding plus viewer controls.

## Example

```js
const viewer = new Viewer3D({
  container: "#app",
  url: "http://localhost:3000/mainviewer?fileList=...",
  allowedOrigin: "http://localhost:3000",
});

viewer.init();
viewer.render();
```

## Manual open

You can also initialize first and switch the iframe URL later:

```js
viewer.init();
viewer.open("http://localhost:3000/mainviewer?fileList=...");
```
