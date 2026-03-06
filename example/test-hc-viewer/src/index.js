import { HcViewer } from "hc-viewer";

window.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("fileInput");
  const uploadBtn = document.getElementById("uploadBtn");
  const convertBtn = document.getElementById("convertBtn");
  const openBtn = document.getElementById("openBtn");
  const statusText = document.getElementById("statusText");

  const zoomInBtn = document.getElementById("zoomInBtn");
  const zoomOutBtn = document.getElementById("zoomOutBtn");
  const homeBtn = document.getElementById("homeBtn");
  const panOnBtn = document.getElementById("panOnBtn");
  const panOffBtn = document.getElementById("panOffBtn");

  let selectedFile = null;
  let preparedData = null;

  const viewer = new HcViewer({
    container: "#app",
    baseUrl: "https://dev.3dviewer.anybim.vn",
    url: 'http://localhost:3000/mainviewer?fileList=%5B%7B%22baseFileId%22%3A%22543efee5-c7e8-4697-ac71-92bfca518a4c%22%2C%22baseMajorRev%22%3A0%2C%22baseMinorRev%22%3A0%2C%22fileName%22%3A%22DataCenter_Example.rvt%22%7D%5D',
    allowedOrigin: "http://localhost:3000",
  });

  viewer.init();

  const setStatus = (text) => {
    if (statusText) statusText.textContent = text;
  };

  const refreshButtons = (busy = false) => {
    const hasFile = Boolean(selectedFile);
    const hasPrepared = Boolean(preparedData);
    const hasDirectUrl = Boolean(viewer.getUrl());

    if (fileInput) fileInput.disabled = busy;
    if (uploadBtn) uploadBtn.disabled = busy || !hasFile;
    if (convertBtn) convertBtn.disabled = busy || !hasFile;
    if (openBtn) openBtn.disabled = busy || (!hasPrepared && !hasDirectUrl);
  };

  const getSelectedFile = () => {
    if (!selectedFile) {
      alert("Please select a file first.");
      return null;
    }
    return selectedFile;
  };

  setStatus("Idle");
  refreshButtons(false);

  fileInput?.addEventListener("change", (event) => {
    const input = event.target;
    const files = input?.files;
    selectedFile = files && files.length > 0 ? files[0] : null;
    preparedData = null;
    viewer.patchOptions({ file: selectedFile || undefined });
    setStatus(selectedFile ? `Selected: ${selectedFile.name}` : "Idle");
    refreshButtons(false);
  });

  uploadBtn?.addEventListener("click", async () => {
    const file = getSelectedFile();
    if (!file) return;

    preparedData = null;
    refreshButtons(false);
    try {
      await viewer.files.upload(file);
    } catch (error) {
      console.error(error);
    }
  });

  convertBtn?.addEventListener("click", async () => {
    const file = getSelectedFile();
    if (!file) return;

    try {
      preparedData = await viewer.files.convert(file);
      refreshButtons(false);
    } catch (error) {
      console.error(error);
    }
  });

  openBtn?.addEventListener("click", () => {
    const directUrl = viewer.getUrl();
    if (directUrl) {
      viewer.open(directUrl);
      return;
    }

    if (!preparedData) {
      alert("No converted file yet. Please convert first.");
      return;
    }
    viewer.files.open(preparedData);
  });

  viewer.files.on.state((state) => {
    const elapsed = typeof state.elapsedMs === "number"
      ? ` - ${Math.round(state.elapsedMs / 1000)}s`
      : "";
    setStatus(`${state.stage}: ${state.message || ""}${elapsed}`.trim());
    refreshButtons(Boolean(state.isLoading));
  });

  viewer.files.on.uploadSuccess((payload) => {
    alert(`Upload success: ${payload.fileName}`);
  });

  viewer.files.on.uploadError((payload) => {
    alert(`Upload failed: ${payload.error}`);
  });

  viewer.files.on.conversionSuccess((payload) => {
    preparedData = payload;
    refreshButtons(false);
    alert(`Conversion success: ${payload.fileName}`);
  });

  viewer.files.on.conversionError((payload) => {
    alert(`Conversion failed: ${payload.error}`);
  });

  viewer.files.on.renderSuccess(() => {
    setStatus("Viewer opened");
  });

  viewer.camera.on.home((payload) => console.log("Home clicked:", payload));
  viewer.node.on.select((payload) => console.log("Node selected:", payload.nodeId));
  viewer.interaction.on.panChange((payload) => console.log("Pan state:", payload.enabled));

  zoomInBtn?.addEventListener("click", () => viewer.camera.zoomIn(10));
  zoomOutBtn?.addEventListener("click", () => viewer.camera.zoomOut(10));
  homeBtn?.addEventListener("click", () => viewer.camera.home());
  panOnBtn?.addEventListener("click", () => viewer.interaction.enablePan());
  panOffBtn?.addEventListener("click", () => viewer.interaction.disablePan());
});
