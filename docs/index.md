---
layout: home

hero:
  name: CXV 3DViewer SDK
  text: Embed, control, and ship viewer integrations faster
  tagline: A developer portal for direct viewer embedding, file pipeline flow, typed SDK methods, and local documentation workflow.
  actions:
    - theme: brand
      text: Start Integration
      link: /getting-started/quick-start
    - theme: alt
      text: Browse API
      link: /api/viewer3d
    - theme: alt
      text: Viewer Setup
      link: /getting-started/viewer-app

features:
  - title: Direct Viewer Embedding
    details: Mount an existing mainviewer URL into your application and control it through a clean JavaScript API.
  - title: Upload to View Flow
    details: Support upload, conversion, and viewer open flow with typed lifecycle events for loading states and UI feedback.
  - title: Developer Portal Structure
    details: Navigate docs by onboarding, guides, API reference, examples, and local project setup instead of one long markdown file.
---

## Overview

CXV 3DViewer SDK is a lightweight JavaScript SDK for embedding and controlling the viewer inside any web application. The SDK does not bundle the viewer app itself. Instead, it communicates with an existing 3dviewer deployment through an iframe and `postMessage`.

This documentation is structured like a developer portal so users can move through a predictable integration path:

- Start with setup and quick start.
- Choose direct viewer mode or file pipeline mode.
- Move into the API reference for exact methods and payloads.

## Recommended Path

1. [Install the SDK](/getting-started/installation)
2. [Set up the local integration project](/getting-started/project-setup)
3. [Prepare the viewer app](/getting-started/viewer-app)
4. [Implement quick start flow](/getting-started/quick-start)
5. [Use the API reference](/api/viewer3d)

## Explore by Topic

- Getting started: [Installation](/getting-started/installation), [Project Setup](/getting-started/project-setup), [Viewer App Setup](/getting-started/viewer-app), [Quick Start](/getting-started/quick-start)
- Guides: [Direct Viewer Mode](/guides/direct-viewer-mode), [File Pipeline Mode](/guides/file-pipeline), [Local Example App](/examples/local-testing)
- API reference: [Viewer3D](/api/viewer3d), [Files Module](/api/files), [Controls](/api/controls), [Markup](/api/markup), [Events](/api/events)
