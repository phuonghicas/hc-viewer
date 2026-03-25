# Files Module

## Methods

```js
viewer.files.setConfig({
  baseUrl: "https://dev.3dviewer.anybim.vn",
  viewerPath: "/mainviewer",
  uploadPath: ".",
});

const state = viewer.files.getState();

await viewer.files.upload(file);
const prepared = await viewer.files.convert(file);
const prepared2 = await viewer.files.prepare(file);
viewer.files.open(prepared2);
await viewer.files.render(file);
```

## Return shape

`convert()`, `prepare()`, and `render()` return:

```ts
type PreparedViewerData = {
  baseFileId: string;
  baseMajorRev: number;
  baseMinorRev: number;
  fileName: string;
  query: string;
  url: string;
};
```

## State shape

```ts
type LoadStage =
  | "idle"
  | "uploading"
  | "converting"
  | "rendering"
  | "completed"
  | "error";

type LoadStatePayload = {
  isLoading: boolean;
  stage: LoadStage;
  message?: string;
  elapsedMs?: number;
};
```

## Notes

- `upload()` uploads only.
- `convert()` converts only.
- `prepare()` runs upload plus convert.
- `render()` runs upload plus convert plus open.
