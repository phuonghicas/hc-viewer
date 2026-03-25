# Markup

## Scope

`viewer.markup` currently targets 3D viewer markup flows.

The documented SDK flow in this page is for 3D markup actions, save/cancel handling, and markup list retrieval.

## Drawing actions

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

## Save and cancel

```js
await viewer.markup.save();
await viewer.markup.cancel();
```

Optional timeout:

```js
await viewer.markup.save({ timeoutMs: 15000 });
await viewer.markup.cancel({ timeoutMs: 15000 });
```

These methods are request-response APIs. They resolve or reject after the embedded viewer replies.

## Get markup list

```js
const markups = await viewer.markup.getList();
console.log(markups);
```

Optional timeout:

```js
const markups = await viewer.markup.getList({ timeoutMs: 15000 });
```

## Returned list item

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

## Notes

- Current SDK documentation only covers markup support for 3D viewer flows.
- PDF markup is not documented as a supported SDK flow yet.
- The current SDK design does not expose public `viewer.markup.on.*` listeners.
