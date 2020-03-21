"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// some relevent dom objects
exports.inputLon = document.getElementById('lon');
exports.inputLat = document.getElementById('lat');
exports.inputZoom = document.getElementById('zoom');
exports.inputform = document.getElementById('heightfield-inputs');
const maxHeightDisplay = document.getElementById('max-height');
const minHeightDisplay = document.getElementById('min-height');
const legend = document.getElementById('legend');
const viewPanel = document.getElementById('view');
const instructionsPanel = document.getElementById('instructions');
var UIMode;
(function (UIMode) {
    UIMode[UIMode["Globe"] = 0] = "Globe";
    UIMode[UIMode["Heightmap"] = 1] = "Heightmap";
})(UIMode = exports.UIMode || (exports.UIMode = {}));
function setMode(mode) {
    legend.style.display = mode == UIMode.Heightmap ? "" : "none";
    viewPanel.style.display = mode == UIMode.Heightmap ? "" : "none";
    instructionsPanel.style.display = mode == UIMode.Globe ? "" : "none";
}
exports.setMode = setMode;
function setMinMaxHeightDisplay(minHeight, maxHeight) {
    minHeightDisplay.textContent = Math.floor(minHeight) + "m";
    maxHeightDisplay.textContent = Math.floor(maxHeight) + "m";
}
exports.setMinMaxHeightDisplay = setMinMaxHeightDisplay;
