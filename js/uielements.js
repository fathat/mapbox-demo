// some relevant dom objects
export const inputLon = document.getElementById('lon');
export const inputLat = document.getElementById('lat');
export const inputZoom = document.getElementById('zoom');
export const inputform = document.getElementById('heightfield-inputs');
const maxHeightDisplay = document.getElementById('max-height');
const minHeightDisplay = document.getElementById('min-height');
const legend = document.getElementById('legend');
const viewPanel = document.getElementById('view');
const instructionsPanel = document.getElementById('instructions');
const pointInfo = document.getElementById('point-info');
const loading = document.getElementById('loading');
export let UIMode;

(function (UIMode) {
  UIMode[UIMode["Globe"] = 0] = "Globe";
  UIMode[UIMode["Heightmap"] = 1] = "Heightmap";
})(UIMode || (UIMode = {}));

export function doneLoading() {
  loading.style.display = "none";
}
export function setMode(mode) {
  legend.style.display = mode == UIMode.Heightmap ? "" : "none";
  viewPanel.style.display = mode == UIMode.Heightmap ? "" : "none";
  instructionsPanel.style.display = mode == UIMode.Globe ? "" : "none";
  pointInfo.style.display = mode == UIMode.Heightmap ? "" : "none";
}
export function setMinMaxHeightDisplay(minHeight, maxHeight) {
  minHeightDisplay.textContent = Math.floor(minHeight) + "m";
  maxHeightDisplay.textContent = Math.floor(maxHeight) + "m";
}
export function clearPointInfo() {
  pointInfo.textContent = "Double Click to Sample Height";
}
export function setPointInfo(height) {
  pointInfo.textContent = `Height: ${height}m`;
}

