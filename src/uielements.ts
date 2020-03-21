// some relevent dom objects
export const inputLon: HTMLInputElement = document.getElementById('lon') as HTMLInputElement;
export const inputLat: HTMLInputElement = document.getElementById('lat') as HTMLInputElement;
export const inputZoom: HTMLInputElement = document.getElementById('zoom') as HTMLInputElement;
export const inputform: HTMLFormElement = document.getElementById('heightfield-inputs') as HTMLFormElement;

const maxHeightDisplay: HTMLDivElement = document.getElementById('max-height') as HTMLDivElement;
const minHeightDisplay: HTMLDivElement = document.getElementById('min-height') as HTMLDivElement;
const legend: HTMLDivElement = document.getElementById('legend') as HTMLDivElement;
const viewPanel: HTMLDivElement = document.getElementById('view') as HTMLDivElement;
const instructionsPanel: HTMLDivElement = document.getElementById('instructions') as HTMLDivElement;

export enum UIMode {
    Globe,
    Heightmap
}

export function setMode(mode: UIMode) {
    legend.style.display = mode == UIMode.Heightmap ? "" : "none";
    viewPanel.style.display = mode == UIMode.Heightmap ? "" : "none";
    instructionsPanel.style.display = mode == UIMode.Globe ? "" : "none";
}

export function setMinMaxHeightDisplay(minHeight: number, maxHeight: number) {
    minHeightDisplay.textContent = Math.floor(minHeight) + "m";
    maxHeightDisplay.textContent = Math.floor(maxHeight) + "m";
}