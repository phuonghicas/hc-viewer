# hc-viewer

A lightweight and framework-agnostic text viewer SDK.

## ✨ Features

- Framework independent
- TypeScript support
- ESM + CJS builds
- Simple lifecycle API

## 📦 Installation

```bash
npm install @phuongdao/hc-viewer
```

## 🚀 Usage

```ts
import { HcViewer } from "@phuongdao/hc-viewer";

const viewer = new HcViewer({
  container: "#app",
  text: "Hello from hc-viewer 🚀"
});

viewer.render();
```

## 🛠 API

### new HcViewer(options)

| Option | Type | Required |
|--------|------|----------|
| container | string \| HTMLElement | ✅ |
| text | string | ✅ |

### Methods

- `render()`
- `update(text: string)`
- `destroy()`

