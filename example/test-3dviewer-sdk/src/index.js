import { Viewer3D } from "3dviewer-sdk";

window.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("fileInput");
  const uploadBtn = document.getElementById("uploadBtn");
  const convertBtn = document.getElementById("convertBtn");
  const openBtn = document.getElementById("openBtn");
  const statusText = document.getElementById("statusText");
  const layout = document.getElementById("layout");
  const toggleSidebarBtn = document.getElementById("toggleSidebarBtn");

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
  const explodePercentInput = document.getElementById("explodePercentInput");
  const applyExplodeBtn = document.getElementById("applyExplodeBtn");
  const explodeOffBtn = document.getElementById("explodeOffBtn");
  const openClippingBtn = document.getElementById("openClippingBtn");
  const closeClippingBtn = document.getElementById("closeClippingBtn");
  const cuttingCloseSectionsBtn = document.getElementById("cuttingCloseSectionsBtn");
  const cuttingMultiBtn = document.getElementById("cuttingMultiBtn");
  const cuttingToggleSelectionBtn = document.getElementById("cuttingToggleSelectionBtn");
  const cuttingTogglePlanesBtn = document.getElementById("cuttingTogglePlanesBtn");
  const cuttingPlaneXBtn = document.getElementById("cuttingPlaneXBtn");
  const cuttingPlaneYBtn = document.getElementById("cuttingPlaneYBtn");
  const cuttingPlaneZBtn = document.getElementById("cuttingPlaneZBtn");
  const cuttingPlaneBoxBtn = document.getElementById("cuttingPlaneBoxBtn");
  const cuttingRotateBoxBtn = document.getElementById("cuttingRotateBoxBtn");
  const cuttingReverseXBtn = document.getElementById("cuttingReverseXBtn");
  const cuttingReverseYBtn = document.getElementById("cuttingReverseYBtn");
  const cuttingReverseZBtn = document.getElementById("cuttingReverseZBtn");
  const openSettingBtn = document.getElementById("openSettingBtn");
  const closeSettingBtn = document.getElementById("closeSettingBtn");
  const openStatesObjectsBtn = document.getElementById("openStatesObjectsBtn");
  const closeStatesObjectsBtn = document.getElementById("closeStatesObjectsBtn");
  const openLinkedObjectsBtn = document.getElementById("openLinkedObjectsBtn");
  const closeLinkedObjectsBtn = document.getElementById("closeLinkedObjectsBtn");
  const openModelTreeBtn = document.getElementById("openModelTreeBtn");
  const closeModelTreeBtn = document.getElementById("closeModelTreeBtn");
  const openObjectPropertiesBtn = document.getElementById("openObjectPropertiesBtn");
  const closeObjectPropertiesBtn = document.getElementById("closeObjectPropertiesBtn");
  const openSheetsBtn = document.getElementById("openSheetsBtn");
  const closeSheetsBtn = document.getElementById("closeSheetsBtn");
  const getSheetsBtn = document.getElementById("getSheetsBtn");
  const sheetIdInput = document.getElementById("sheetIdInput");
  const applySheetByIdBtn = document.getElementById("applySheetByIdBtn");
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

  const setSidebarCollapsed = (collapsed) => {
    if (!layout || !toggleSidebarBtn) return;
    layout.classList.toggle("sidebar-collapsed", collapsed);
    toggleSidebarBtn.textContent = collapsed ? ">" : "<";
    toggleSidebarBtn.title = collapsed ? "Expand Sidebar" : "Collapse Sidebar";
    toggleSidebarBtn.setAttribute("aria-label", collapsed ? "Expand Sidebar" : "Collapse Sidebar");
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
  setSidebarCollapsed(false);

  toggleSidebarBtn?.addEventListener("click", () => {
    const collapsed = layout?.classList.contains("sidebar-collapsed");
    setSidebarCollapsed(!collapsed);
  });

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
  applyExplodeBtn?.addEventListener("click", () => {
    const raw = explodePercentInput?.value?.trim();
    const percent = Number(raw);
    if (!raw || Number.isNaN(percent) || percent < 0 || percent > 100) {
      alert("Please enter explode percent from 0 to 100.");
      return;
    }
    viewer.interaction.explode(percent / 100);
    alert(`Applied explode: ${percent}%`);
  });
  explodeOffBtn?.addEventListener("click", () => viewer.interaction.explodeOff());
  openClippingBtn?.addEventListener("click", () => viewer.toolbar.openClippingPlanes());
  closeClippingBtn?.addEventListener("click", () => viewer.toolbar.closeClippingPlanes());
  cuttingCloseSectionsBtn?.addEventListener("click", () => viewer.toolbar.cuttingCloseSections());
  cuttingMultiBtn?.addEventListener("click", () => viewer.toolbar.cuttingMultipleSides());
  cuttingToggleSelectionBtn?.addEventListener("click", () => viewer.toolbar.cuttingToggleSelection());
  cuttingTogglePlanesBtn?.addEventListener("click", () => viewer.toolbar.cuttingTogglePlanes());
  cuttingPlaneXBtn?.addEventListener("click", () => viewer.toolbar.cuttingPlaneX());
  cuttingPlaneYBtn?.addEventListener("click", () => viewer.toolbar.cuttingPlaneY());
  cuttingPlaneZBtn?.addEventListener("click", () => viewer.toolbar.cuttingPlaneZ());
  cuttingPlaneBoxBtn?.addEventListener("click", () => viewer.toolbar.cuttingPlaneBox());
  cuttingRotateBoxBtn?.addEventListener("click", () => viewer.toolbar.cuttingRotateBox());
  cuttingReverseXBtn?.addEventListener("click", () => viewer.toolbar.cuttingReversePlaneX());
  cuttingReverseYBtn?.addEventListener("click", () => viewer.toolbar.cuttingReversePlaneY());
  cuttingReverseZBtn?.addEventListener("click", () => viewer.toolbar.cuttingReversePlaneZ());
  openSettingBtn?.addEventListener("click", () => viewer.toolbar.openSetting());
  closeSettingBtn?.addEventListener("click", () => viewer.toolbar.closeSetting());
  openStatesObjectsBtn?.addEventListener("click", () => viewer.toolbar.openStatesObjects());
  closeStatesObjectsBtn?.addEventListener("click", () => viewer.toolbar.closeStatesObjects());
  openLinkedObjectsBtn?.addEventListener("click", () => viewer.toolbar.openLinkedObjects());
  closeLinkedObjectsBtn?.addEventListener("click", () => viewer.toolbar.closeLinkedObjects());
  openModelTreeBtn?.addEventListener("click", () => viewer.toolbar.openModelTree());
  closeModelTreeBtn?.addEventListener("click", () => viewer.toolbar.closeModelTree());
  openObjectPropertiesBtn?.addEventListener("click", () => viewer.toolbar.openObjectProperties());
  closeObjectPropertiesBtn?.addEventListener("click", () => viewer.toolbar.closeObjectProperties());
  openSheetsBtn?.addEventListener("click", () => viewer.toolbar.openSheets());
  closeSheetsBtn?.addEventListener("click", () => viewer.toolbar.closeSheets());
  getSheetsBtn?.addEventListener("click", async () => {
    try {
      const sheets = await viewer.toolbar.getSheets();
      console.log("Sheets:", sheets);
      alert(`Found ${sheets.length} sheets. Check console for details.`);
    } catch (error) {
      console.error(error);
      alert(`Get sheets failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  applySheetByIdBtn?.addEventListener("click", () => {
    const raw = sheetIdInput?.value?.trim();
    if (!raw) {
      alert("Please enter a sheetId.");
      return;
    }
    const sheetId = /^-?\d+$/.test(raw) ? Number(raw) : raw;
    viewer.toolbar.applySheet(sheetId);
    alert(`Applied sheetId: ${sheetId}`);
  });
//   disableAll3dToolbarBtn?.addEventListener("click", () => viewer.toolbar.disableAll3D());
//   enableAll3dToolbarBtn?.addEventListener("click", () => viewer.toolbar.enableAll3D());
//   disableAllPdfToolbarBtn?.addEventListener("click", () => viewer.toolbar.disableAllPdf());
//   enableAllPdfToolbarBtn?.addEventListener("click", () => viewer.toolbar.enableAllPdf());
});
