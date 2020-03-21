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
const OrbitControls_js_1 = require("three/examples/jsm/controls/OrbitControls.js");
const location_1 = require("./location");
const globals_1 = require("./globals");
const ui = __importStar(require("./uielements"));
class GlobeScene {
    constructor(renderer) {
        this.active = false;
        // scene objects
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 1000);
        // start loading earth model
        globals_1.gltfLoader.load('assets/earth.glb', (gltf) => {
            this.scene.add(gltf.scene);
            this.planetModel = gltf;
        }, undefined, (errorEvent) => {
            console.error(errorEvent);
        });
        const skybox = globals_1.cubeLoader.load([
            'assets/skybox/right.png',
            'assets/skybox/left.png',
            'assets/skybox/top.png',
            'assets/skybox/bottom.png',
            'assets/skybox/front.png',
            'assets/skybox/back.png',
        ]);
        this.scene.background = skybox;
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
        this.scene.add(this.ambientLight);
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        this.scene.add(this.directionalLight);
        // add a sphere for the atmosphere halo & selection grid
        const sphereGeometry = new THREE.SphereGeometry(0.975, 60, 30);
        this.shaderMaterial = new THREE.ShaderMaterial({
            vertexShader: document.getElementById('halo-vs').textContent,
            fragmentShader: document.getElementById('halo-fs').textContent,
            uniforms: {
                uvHighlightRange: {
                    value: [0.0, 0.0, 0.0, 0.0]
                },
                subdivisions: {
                    value: 1
                }
            },
            transparent: true
        });
        const atmosphereSphere = new THREE.Mesh(sphereGeometry, this.shaderMaterial);
        this.scene.add(atmosphereSphere);
        this.controls = new OrbitControls_js_1.OrbitControls(this.camera, renderer.domElement);
        this.controls.enabled = false;
        this.controls.update();
        this.camera.position.set(0, 0, 3);
        this.directionalLight.position.copy(this.camera.position);
        const onWindowResize = () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        };
        window.addEventListener('resize', onWindowResize, false);
        ui.inputZoom.addEventListener('change', () => { this.updateTileVisualization(); });
        let drag = false;
        let dragStart = { x: 0, y: 0 };
        renderer.domElement.addEventListener('mousedown', (ev) => {
            drag = false;
            dragStart.x = ev.clientX;
            dragStart.y = ev.clientY;
        });
        renderer.domElement.addEventListener('mousemove', (ev) => {
            if (Math.abs(ev.clientX - dragStart.x) > 5
                || Math.abs(ev.clientY - dragStart.y) > 5) {
                drag = true;
            }
        });
        renderer.domElement.addEventListener('mouseup', (ev) => {
            if (drag) {
                return;
            }
            if (!this.planetModel || !this.active) {
                return;
            }
            var collisions = globals_1.raycaster.intersectObjects(this.planetModel.scene.children, true);
            if (collisions.length > 0) {
                //just grab the first intersection
                const hit = collisions[0];
                const latLon = location_1.sphereUVtoLatLon(hit.uv);
                ui.inputLon.value = latLon.x.toString();
                ui.inputLat.value = latLon.y.toString();
                this.updateTileVisualization();
            }
        });
    }
    updateTileVisualization() {
        const loc = location_1.currentLocation();
        const box = location_1.locationToUVbox(loc);
        this.shaderMaterial.uniforms.uvHighlightRange = {
            value: box
        };
        this.shaderMaterial.uniformsNeedUpdate = true;
    }
    setActive(active) {
        this.active = active;
        this.controls.enabled = active;
    }
    animate() {
        globals_1.raycaster.setFromCamera(globals_1.mouse, this.camera);
        this.controls.update();
        this.directionalLight.position.copy(this.camera.position);
    }
    render(renderer) {
        renderer.clear(true, true, true);
        renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
        renderer.render(this.scene, this.camera);
    }
}
exports.GlobeScene = GlobeScene;
