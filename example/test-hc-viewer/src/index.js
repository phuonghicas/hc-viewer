import { HcViewer } from "hc-viewer";

window.addEventListener("DOMContentLoaded", () => {
  const zoomInBtn = document.getElementById("zoomInBtn");
  const zoomOutBtn = document.getElementById("zoomOutBtn");
  const homeBtn = document.getElementById("homeBtn");
  const panOnBtn = document.getElementById("panOnBtn");
  const panOffBtn = document.getElementById("panOffBtn");

  const viewer = new HcViewer({
    container: "#app",
    url: "http://localhost:3000/mainviewer?fileList=%5B%7B%22baseFileId%22%3A%22c6c21c49-fa2b-4506-9bb1-8ef6716c195e%22%2C%22baseMajorRev%22%3A0%2C%22baseMinorRev%22%3A0%2C%22fileName%22%3A%22SP_CHI1-DC1-2_detached.rvt%22%7D%5D",
    allowedOrigin: "http://localhost:3000",
  });

  viewer.init();
  viewer.render();

  // module events (hướng A)
viewer.camera.on.home((payload) => console.log("Home clicked:", payload));
viewer.node.on.select((payload) => console.log("Node selected:", payload.nodeId));
viewer.interaction.on.panChange((payload) => console.log("Pan state:", payload.enabled));

  zoomInBtn?.addEventListener("click", () => viewer.camera.zoomIn(10));
  zoomOutBtn?.addEventListener("click", () => viewer.camera.zoomOut(10));
  homeBtn?.addEventListener("click", () => viewer.camera.home());
  panOnBtn?.addEventListener("click", () => viewer.interaction.enablePan());
  panOffBtn?.addEventListener("click", () => viewer.interaction.disablePan());
});