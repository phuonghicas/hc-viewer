# Events

## Event style

The SDK exposes events with:

```js
viewer.<module>.on.<event>()
```

## Camera events

```js
viewer.camera.on.home((payload) => {
  console.log(payload.timestamp);
});
```

## Node events

```js
viewer.node.on.select((payload) => {
  console.log(payload.nodeId);
});
```

## Interaction events

```js
viewer.interaction.on.panChange((payload) => {
  console.log(payload.enabled);
});
```

## Files lifecycle events

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

## Request-response APIs

Some SDK features use promise-based request-response flows instead of public `.on.*` listeners.

Examples:

```js
await viewer.toolbar.getSheets();
await viewer.modelTree.getNodeIds();
await viewer.markup.save();
await viewer.markup.cancel();
await viewer.markup.getList();
```

## Payload summary

| Event | Payload |
| --- | --- |
| `camera.home` | `{ timestamp: number }` |
| `node.select` | `{ nodeId: string, timestamp: number }` |
| `interaction.panChange` | `{ enabled: boolean }` |
