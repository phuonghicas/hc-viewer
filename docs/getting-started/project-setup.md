# Project Setup

## What you need to run locally

To run the full local integration flow, you usually need three separate pieces:

1. `3dviewer` application
2. `3dviewer-sdk` repository
3. A test app that installs and uses the SDK

## Where to get each part

### 1. 3dviewer application

This is the actual viewer that the SDK embeds in an iframe.

Source:

```text
https://git.anybim.vn/construxiv/cxv-3dviewer
```

The local setup flow for this app is documented in:

- [Viewer App Setup](/getting-started/viewer-app)

### 2. 3dviewer-sdk repository

This is the SDK source repository you are reading now.

Source:

```text
https://git.anybim.vn/construxiv/cxv-3dviewer-sdk
```

### 3. Test app

You need one app to verify that the SDK works from a consumer side.

In this repository, a ready-to-use test app already exists at:

```text
example/test-3dviewer-sdk
```

This app installs the SDK from the local `sdk/` folder with:

```json
"3dviewer-sdk": "file:../../sdk"
```

That means it is intended for local development and testing of the SDK source in this repo.

## Recommended local folder layout

One practical layout is:

```text
workspace/
  cxv-3dviewer/
  cxv-3dviewer-sdk/
```

With this setup:

- `cxv-3dviewer/` runs the viewer app
- `cxv-3dviewer-sdk/` contains the SDK source, docs, and local test app

## Local run order

Run things in this order:

1. Start the `3dviewer` app first.
2. Build or prepare the SDK if needed.
3. Start the test app that consumes the SDK.

## Step 1. Run 3dviewer

Follow the detailed guide in:

- [Viewer App Setup](/getting-started/viewer-app)

In short:

```bash
git clone --branch 3dviewer_SDK --single-branch https://git.anybim.vn/construxiv/cxv-3dviewer
cd cxv-3dviewer
npm install
npm run start
```

Expected local URL:

```text
http://localhost:3000
```

## Step 2. Prepare the SDK repository

Clone the SDK repo:

```bash
git clone https://git.anybim.vn/construxiv/cxv-3dviewer-sdk
cd cxv-3dviewer-sdk
```

Install dependencies used by the docs site and local tooling:

```bash
npm install
```

If you need to build the SDK package itself:

```bash
cd sdk
npm install
npm run build
```

## Step 3. Run the local test app

Use the included example app:

```bash
cd example/test-3dviewer-sdk
npm install
npm start
```

Expected local URL:

```text
http://localhost:5173
```

## What the local test app expects

The test app is configured to talk to:

- viewer origin: `http://localhost:3000`
- conversion API base: `https://dev.3dviewer.anybim.vn`

So the usual local test setup is:

- `3dviewer` is running on port `3000`
- `test-3dviewer-sdk` is running on port `5173`

## Summary

If your goal is to test the full SDK integration locally:

1. Get `3dviewer` from `https://git.anybim.vn/construxiv/cxv-3dviewer`
2. Get `3dviewer-sdk` from `https://git.anybim.vn/construxiv/cxv-3dviewer-sdk`
3. Use `example/test-3dviewer-sdk` as the local consumer app
4. Run viewer first, then run the test app
