import { defineConfig } from "vitepress";

export default defineConfig({
  title: "CXV 3DViewer SDK",
  description: "Developer documentation for integrating the CXV 3DViewer SDK.",
  appearance: false,
  lastUpdated: true,
  cleanUrls: true,
  themeConfig: {
    logo: "/logo.svg",
    search: {
      provider: "local",
    },
    nav: [
      { text: "Overview", link: "/" },
      { text: "Get Started", link: "/getting-started/quick-start" },
      { text: "Guides", link: "/guides/direct-viewer-mode" },
      { text: "API Reference", link: "/api/viewer3d" },
    ],
    sidebar: [
      {
        text: "Onboarding",
        items: [
          { text: "Installation", link: "/getting-started/installation" },
          { text: "Project Setup", link: "/getting-started/project-setup" },
          { text: "Viewer App Setup", link: "/getting-started/viewer-app" },
          { text: "Quick Start", link: "/getting-started/quick-start" },
        ],
      },
      {
        text: "Guides",
        items: [
          { text: "Direct Viewer Mode", link: "/guides/direct-viewer-mode" },
          { text: "File Pipeline Mode", link: "/guides/file-pipeline" },
          { text: "Local Example App", link: "/examples/local-testing" },
        ],
      },
      {
        text: "API Reference",
        items: [
          { text: "Viewer3D", link: "/api/viewer3d" },
          { text: "Files Module", link: "/api/files" },
          { text: "Controls", link: "/api/controls" },
          { text: "Markup", link: "/api/markup" },
          { text: "Events", link: "/api/events" },
        ],
      },
    ],
    footer: {
      message: "CXV 3DViewer SDK documentation",
      copyright: "Copyright 2026 HICAS , Inc.",
    },
  },
});
