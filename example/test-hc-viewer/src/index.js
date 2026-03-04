import { HcViewer } from "hc-viewer";

window.addEventListener("DOMContentLoaded", () => {
  let viewer = null;
  let preparedData = null;
  let uploaded = false;

  const uploadBtn = document.getElementById("uploadBtn");
  const convertBtn = document.getElementById("convertBtn");
  const btn = document.getElementById("openBtn");
  const zoomInBtn = document.getElementById("zoomInBtn");
  const zoomOutBtn = document.getElementById("zoomOutBtn");
  const homeBtn = document.getElementById("homeBtn");
  const panOnBtn = document.getElementById("panOnBtn");
  const panOffBtn = document.getElementById("panOffBtn");
  const baseUrlInput = document.getElementById("baseUrlInput");
  const fileInput = document.getElementById("fileInput");
  const statusText = document.getElementById("statusText");

  function setControlsDisabled(disabled) {
    [uploadBtn, convertBtn, btn, zoomInBtn, zoomOutBtn, homeBtn, panOnBtn, panOffBtn, fileInput].forEach(
      item => {
        item.disabled = disabled;
      }
    );
  }

  function formatStatus(payload) {
    const { stage, message, attempt, maxAttempts, elapsedMs } = payload;
    const progress =
      typeof attempt === "number" && typeof maxAttempts === "number"
        ? ` (${attempt}/${maxAttempts})`
        : "";
    const elapsed =
      typeof elapsedMs === "number" ? ` | ${Math.floor(elapsedMs / 1000)}s` : "";
    return `Status: ${stage}${progress}${message ? ` - ${message}` : ""}${elapsed}`;
  }

  function bindViewerEvents(viewerInstance) {
    viewerInstance.on("load:state", payload => {
      statusText.textContent = formatStatus(payload);
      setControlsDisabled(payload.isLoading);
    });

    viewerInstance.on("conversion:progress", payload => {
      console.log("Conversion progress:", payload);
    });

    viewerInstance.on("upload:success", payload => {
      console.log("Upload success:", payload.fileName);
    });

    viewerInstance.on("conversion:success", payload => {
      console.log("Conversion success:", payload);
    });

    viewerInstance.on("load:error", payload => {
      console.error("Load error:", payload.error);
    });

    viewerInstance.on("camera:home", (payload) => {
      console.log("Home clicked:", payload);
    });

    viewerInstance.on("node:select", (payload) => {
      console.log("Node selected:", payload.nodeId);
    });

    viewerInstance.on("interaction:pan-change", (payload) => {
      console.log("Pan state:", payload.enabled);
    });
  }

  function getSelectedFile() {
    const file = fileInput.files && fileInput.files[0];
    if (!file) {
      alert("Please choose a file first.");
      return null;
    }
    return file;
  }

  function ensureViewer() {
    const baseUrl = (baseUrlInput.value || "").trim();
    if (viewer) return viewer;
    const options = {
      container: "#app",
      allowedOrigin: "http://localhost:3000",
      notify: { success: true, error: true },
      polling: {
        maxAttempts: 120,
        intervalMs: 2000,
      },
    };
    if (baseUrl) {
      options.baseUrl = baseUrl;
    }
    viewer = new HcViewer(options);
    bindViewerEvents(viewer);
    return viewer;
  }

  fileInput.addEventListener("change", () => {
    uploaded = false;
    preparedData = null;
    statusText.textContent = "Status: idle - file selected, please upload";
  });

  uploadBtn.addEventListener("click", async () => {
    const file = getSelectedFile();
    if (!file) return;

    const inst = ensureViewer();
    try {
      await inst.upload(file);
      uploaded = true;
      preparedData = null;
    } catch (error) {
      console.error("Upload failed:", error);
    }
  });

  convertBtn.addEventListener("click", async () => {
    const file = getSelectedFile();
    if (!file) return;
    if (!uploaded) {
      alert("Please upload file first.");
      return;
    }

    const inst = ensureViewer();
    try {
      preparedData = await inst.convert(file);
    } catch (error) {
      console.error("Conversion failed:", error);
    }
  });

  btn.addEventListener("click", async () => {
    if (!viewer) {
      alert("Please upload and convert file first.");
      return;
    }
    if (!preparedData) {
      alert("Please run conversion first.");
      return;
    }

    try {
      await viewer.renderPrepared(preparedData);
    } catch (error) {
      console.error("Open viewer failed:", error);
    }
  });

  baseUrlInput.addEventListener("change", () => {
    if (viewer) {
      viewer.destroy();
      viewer = null;
    }
    uploaded = false;
    preparedData = null;
    statusText.textContent = "Status: idle - baseUrl changed";
  });

  btn.textContent = "Open Viewer";

  zoomInBtn.addEventListener("click", () => {
    if (!viewer) {
      alert("Viewer is not opened yet.");
      return;
    }
    viewer.zoomIn(20);
  });

  zoomOutBtn.addEventListener("click", () => {
    if (!viewer) {
      alert("Viewer is not opened yet.");
      return;
    }
    viewer.zoomOut(20);
  });

  homeBtn.addEventListener("click", () => {
    if (!viewer) {
      alert("Viewer is not opened yet.");
      return;
    }
    viewer.goHome();
  });

  panOnBtn.addEventListener("click", () => {
    if (!viewer) {
      alert("Viewer is not opened yet.");
      return;
    }
    viewer.enablePan();
  });

  panOffBtn.addEventListener("click", () => {
    if (!viewer) {
      alert("Viewer is not opened yet.");
      return;
    }
    viewer.disablePan();
  });
});
