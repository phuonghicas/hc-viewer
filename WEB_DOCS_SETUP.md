# Web Docs Setup

This guide explains how to run the SDK documentation website locally.

It is intentionally kept outside the public web docs because it is a repository maintenance guide, not part of the SDK integration guide for consumers.

## Repository

The docs site lives inside the SDK repository:

```text
https://git.anybim.vn/construxiv/cxv-3dviewer-sdk
```

Clone the repository if you do not already have it:

```bash
git clone https://git.anybim.vn/construxiv/cxv-3dviewer-sdk
cd cxv-3dviewer-sdk
```

## Install dependencies

Install the dependencies required by the docs site:

```bash
npm install
```

## Run the docs site locally

Start the VitePress development server:

```bash
npm run docs:dev
```

This opens the local developer portal for the SDK, including:

- home page
- getting started guides
- API reference pages
- local examples and integration guides

The terminal will print a local URL, usually something like:

```text
http://localhost:5173
```

## Build the docs site

To verify that the docs can be built successfully:

```bash
npm run docs:build
```

To preview the built output locally:

```bash
npm run docs:preview
```

## Compatibility note

This repository includes a small Node 16 crypto compatibility shim for VitePress. That shim is already wired into the docs scripts in the root `package.json`.

## Summary

If you only want to work on the documentation portal:

1. Clone `cxv-3dviewer-sdk`
2. Run `npm install`
3. Run `npm run docs:dev`
4. Open the local VitePress URL shown in the terminal
