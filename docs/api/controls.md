# Controls

## Camera

```js
viewer.camera.zoomIn(10);
viewer.camera.zoomOut(10);
viewer.camera.home();
```

## Interaction

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

### Draw modes

```js
viewer.interaction.drawModeShaded();
viewer.interaction.drawModeWireframe();
viewer.interaction.drawModeHiddenLine();
viewer.interaction.drawModeShadedWire();
viewer.interaction.drawModeXRay();
viewer.interaction.drawModeGhosting();
```

### Explode

```js
viewer.interaction.explode(0.5);
viewer.interaction.explodeOff();
```

## Markup

```js
viewer.markup.drawLine();
viewer.markup.drawArrow();
viewer.markup.drawRectangle();
viewer.markup.drawNote();
await viewer.markup.save();
const markups = await viewer.markup.getList();
```

See the dedicated [Markup](/api/markup) page for the full list of actions and response shapes.

## Toolbar panels

```js
viewer.toolbar.openClippingPlanes();
viewer.toolbar.closeClippingPlanes();
viewer.toolbar.openSetting();
viewer.toolbar.closeSetting();
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

## Toolbar configuration

```js
viewer.toolbar.disableAll3D();
viewer.toolbar.enableAll3D();
viewer.toolbar.disableAllPdf();
viewer.toolbar.enableAllPdf();
```

These APIs require viewer-side support for `viewer-toolbar-config`. If your 3dviewer build disables or removes that handler, these methods will not have visible effect.

## Sheets

```js
const sheets = await viewer.toolbar.getSheets({ timeoutMs: 15000 });
viewer.toolbar.applySheet(sheets[0].id);
```

## Cutting planes

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

## Model tree

```js
viewer.modelTree.open();
viewer.modelTree.selectNode("123");

const nodeIds = await viewer.modelTree.getNodeIds();
const allNodeIds = await viewer.modelTree.getNodeIds({
  onlyRealNodes: false,
  timeoutMs: 15000,
});
```
