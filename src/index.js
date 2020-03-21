"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const THREE = __importStar(require("three"));
const ui = __importStar(require("./uielements"));
const globals_1 = require("./globals");
const scenes_1 = require("./scenes");
let sceneManager;
function main() {
    // Create renderer. Note that we set auto-clear
    // to false because the heightmap scene needs to composite
    // multiple render calls.
    const renderer = new THREE.WebGLRenderer();
    renderer.autoClear = false;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor('#001122');
    document.body.appendChild(renderer.domElement);
    // Track mouse coordinates
    function onMouseMove(event) {
        globals_1.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        globals_1.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
    window.addEventListener('mousemove', onMouseMove, false);
    // Make sure to resize renderer on browser resize.
    const onWindowResize = () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onWindowResize, false);
    sceneManager = new scenes_1.SceneManager(renderer);
    // Hook up the back button to bring us back to the globe scene
    // (this button is only visible from the heightmap scene)
    document.getElementById("view-globe-btn").onclick = () => {
        sceneManager.switchScene(sceneManager.globeScene);
    };
    // hook up the "view heightfield" button
    ui.inputform.onsubmit = (e) => {
        e.preventDefault();
        sceneManager.heightmapScene.rebuildMesh();
        sceneManager.switchScene(sceneManager.heightmapScene);
        return false;
    };
    // hide elements specific to the heightmap scene by default.
    ui.setMode(ui.UIMode.Globe);
    // start the update loop
    const animate = () => {
        requestAnimationFrame(animate);
        sceneManager.animate();
        sceneManager.render(renderer);
    };
    animate();
}
main();
