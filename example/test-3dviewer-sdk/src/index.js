import { Viewer3D } from "3dviewer-sdk";

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
  const selectBtn = document.getElementById("selectBtn");
  const areaSelectBtn = document.getElementById("areaSelectBtn");
  const orbitBtn = document.getElementById("orbitBtn");
  const rotateZBtn = document.getElementById("rotateZBtn");
  const walkThroughBtn = document.getElementById("walkThroughBtn");
  const zoomWindowBtn = document.getElementById("zoomWindowBtn");
  const zoomFitBtn = document.getElementById("zoomFitBtn");
  const drawModeShadedBtn = document.getElementById("drawModeShadedBtn");
  const drawModeWireframeBtn = document.getElementById("drawModeWireframeBtn");
  const drawModeHiddenLineBtn = document.getElementById("drawModeHiddenLineBtn");
  const drawModeShadedWireBtn = document.getElementById("drawModeShadedWireBtn");
  const drawModeXrayBtn = document.getElementById("drawModeXrayBtn");
  const drawModeGhostingBtn = document.getElementById("drawModeGhostingBtn");
  const explodeHalfBtn = document.getElementById("explodeHalfBtn");
  const explodeOffBtn = document.getElementById("explodeOffBtn");
  const openClippingBtn = document.getElementById("openClippingBtn");
  const openSettingBtn = document.getElementById("openSettingBtn");
  const openStatesObjectsBtn = document.getElementById("openStatesObjectsBtn");
  const openLinkedObjectsBtn = document.getElementById("openLinkedObjectsBtn");
//   const disableAll3dToolbarBtn = document.getElementById("disableAll3dToolbarBtn");
//   const enableAll3dToolbarBtn = document.getElementById("enableAll3dToolbarBtn");
//   const disableAllPdfToolbarBtn = document.getElementById("disableAllPdfToolbarBtn");
//   const enableAllPdfToolbarBtn = document.getElementById("enableAllPdfToolbarBtn");

  let selectedFile = null;
  let preparedData = null;

  const viewer = new Viewer3D({
    container: "#app",
    baseUrl: "https://dev.3dviewer.anybim.vn",
    url: "http://localhost:3000/mainviewer?fileList=%5B%7B%22baseFileId%22%3A%22543efee5-c7e8-4697-ac71-92bfca518a4c%22%2C%22baseMajorRev%22%3A0%2C%22baseMinorRev%22%3A0%2C%22fileName%22%3A%22DataCenter_Example.rvt%22%7D%5D",
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

    if (!preparedData) {
      if (directUrl) {
        viewer.open(directUrl);
        alert("You are opening from direct URL.");
        return;
      }
      alert("No converted file yet. Please convert first.");
      return;
    }
    viewer.files.open(preparedData);
  });

  viewer.files.on.state((state) => {
    const elapsed = typeof state.elapsedMs === "number" ? ` - ${Math.round(state.elapsedMs / 1000)}s` : "";
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
  selectBtn?.addEventListener("click", () => viewer.interaction.select());
  areaSelectBtn?.addEventListener("click", () => viewer.interaction.areaSelect());
  orbitBtn?.addEventListener("click", () => viewer.interaction.orbit());
  rotateZBtn?.addEventListener("click", () => viewer.interaction.rotateZ());
  walkThroughBtn?.addEventListener("click", () => viewer.interaction.walkThrough());
  zoomWindowBtn?.addEventListener("click", () => viewer.interaction.zoomWindow());
  zoomFitBtn?.addEventListener("click", () => viewer.interaction.zoomFit());
  drawModeShadedBtn?.addEventListener("click", () => viewer.interaction.drawModeShaded());
  drawModeWireframeBtn?.addEventListener("click", () => viewer.interaction.drawModeWireframe());
  drawModeHiddenLineBtn?.addEventListener("click", () => viewer.interaction.drawModeHiddenLine());
  drawModeShadedWireBtn?.addEventListener("click", () => viewer.interaction.drawModeShadedWire());
  drawModeXrayBtn?.addEventListener("click", () => viewer.interaction.drawModeXRay());
  drawModeGhostingBtn?.addEventListener("click", () => viewer.interaction.drawModeGhosting());
  explodeHalfBtn?.addEventListener("click", () => viewer.interaction.explode(0.5));
  explodeOffBtn?.addEventListener("click", () => viewer.interaction.explodeOff());
  openClippingBtn?.addEventListener("click", () => viewer.toolbar.openClippingPlanes());
  openSettingBtn?.addEventListener("click", () => viewer.toolbar.openSetting());
  openStatesObjectsBtn?.addEventListener("click", () => viewer.toolbar.openStatesObjects());
  openLinkedObjectsBtn?.addEventListener("click", () => viewer.toolbar.openLinkedObjects());
//   disableAll3dToolbarBtn?.addEventListener("click", () => viewer.toolbar.disableAll3D());
//   enableAll3dToolbarBtn?.addEventListener("click", () => viewer.toolbar.enableAll3D());
//   disableAllPdfToolbarBtn?.addEventListener("click", () => viewer.toolbar.disableAllPdf());
//   enableAllPdfToolbarBtn?.addEventListener("click", () => viewer.toolbar.enableAllPdf());
});
