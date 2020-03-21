"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const OrbitControls_js_1 = require("three/examples/jsm/controls/OrbitControls.js");
const THREE = __importStar(require("three"));
const three_1 = require("three");
const location_1 = require("./location");
const globals_1 = require("./globals");
const ui = __importStar(require("./uielements"));
class HeightmapScene {
    constructor(renderer) {
        // is this scene active?
        // (note: hypothetically possible to have multiple active scenes,
        // probably a bad idea.)
        this.active = false;
        // cache the minimum and maximum heights
        this.minHeight = Number.MAX_VALUE;
        this.maxHeight = Number.MIN_VALUE;
        this.heights = [];
        this.w = 0;
        this.h = 0;
        // scene objects
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 1000);
        this.compassScene = new THREE.Scene();
        this.compassCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 100);
        const skybox = globals_1.cubeLoader.load([
            'assets/ground-skybox/right.png',
            'assets/ground-skybox/left.png',
            'assets/ground-skybox/top.png',
            'assets/ground-skybox/bottom.png',
            'assets/ground-skybox/front.png',
            'assets/ground-skybox/back.png',
        ]);
        this.scene.background = skybox;
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
        this.scene.add(this.ambientLight);
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        this.scene.add(this.directionalLight);
        // setup compass scene
        const compassAmbientLight = new THREE.AmbientLight(0xffffff, 1.0);
        this.compassScene.add(compassAmbientLight);
        const compassLight = new THREE.DirectionalLight(0xffffff, 1.0);
        compassLight.position.set(0, 10, 0);
        this.compassScene.add(compassLight);
        // start loading earth model
        globals_1.gltfLoader.load('assets/compass.glb', (gltf) => {
            this.compass = gltf;
            this.compassScene.add(this.compass.scene);
        }, undefined, (errorEvent) => {
            console.error(errorEvent);
        });
        // plane       
        this.rebuildMesh();
        this.controls = new OrbitControls_js_1.OrbitControls(this.camera, renderer.domElement);
        this.controls.enabled = false;
        this.camera.position.set(0, 128, 128);
        this.compassCamera.position.set(0, 5, 0);
        this.compassCamera.setRotationFromEuler(new THREE.Euler(-90 * (3.14159 / 180.0), 0, 0));
        this.controls.update();
        this.directionalLight.position.copy(this.camera.position);
        // Make sure to update the cameras when the window resizes
        const onWindowResize = () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.compassCamera.aspect = window.innerWidth / window.innerHeight;
            this.compassCamera.updateProjectionMatrix();
        };
        window.addEventListener('resize', onWindowResize, false);
    }
    rebuildMesh() {
        if (this.terrain) {
            this.scene.remove(this.terrain);
        }
        let img = new Image();
        // need to do this or we have a CORS issue
        // accessing the pixel data out of the image
        img.crossOrigin = "Anonymous";
        img.onload = (event) => {
            this.w = img.width;
            this.h = img.height;
            const w = this.w;
            const h = this.h;
            // write the image pixels to a context so that we can read it back
            const canvas = document.createElement('canvas');
            canvas.width = this.w;
            canvas.height = this.h;
            let context = canvas.getContext('2d');
            context.drawImage(img, 0, 0);
            globals_1.textureLoader.load(canvas.toDataURL(), (texture) => {
                this.terrainGeometry = new THREE.PlaneGeometry(w, h, w - 1, h - 1);
                const imgData = context.getImageData(0, 0, w, h);
                this.readHeightsFromImageData(imgData);
                ui.setMinMaxHeightDisplay(this.minHeight, this.maxHeight);
                // Load height data into the terrain geometry. Renormalize all the heights
                // so max height is always 32. 
                this.rebuildGeometry();
                // Setup the terrain material to use a color ramp with a shader material
                globals_1.textureLoader.load('assets/color-ramp.jpg', (rampTexture) => {
                    this.terrainMaterial = new THREE.ShaderMaterial({
                        vertexShader: document.getElementById('map-vs').textContent,
                        fragmentShader: document.getElementById('map-fs').textContent,
                        uniforms: {
                            rampTexture: {
                                type: 't',
                                value: rampTexture
                            },
                            maxHeight: {
                                value: this.scaledHeightRange()
                            }
                        },
                        side: THREE.DoubleSide,
                        vertexColors: true
                    });
                    this.terrain = new THREE.Mesh(this.terrainGeometry, this.terrainMaterial);
                    this.terrain.setRotationFromEuler(new THREE.Euler(-90 * (3.14159 / 180.0), 0, 0));
                    this.scene.add(this.terrain);
                });
            });
        };
        location_1.loadTileFromLatLonIntoImage(location_1.currentLocation(), img);
    }
    heightRange() {
        return this.maxHeight - this.minHeight;
    }
    scaledHeightRange() {
        const loc = location_1.currentLocation();
        if (loc.zoom <= 3) {
            return 10.0;
        }
        return Math.max(this.heightRange() / 50.0, 20.0);
    }
    rebuildGeometry() {
        const w = this.w;
        const h = this.h;
        if (!this.terrainGeometry) {
            console.error("terrain geometry doesn't exist somehow!");
            return;
        }
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const height = this.heights[x + y * w];
                const normalizedHeight = (height - this.minHeight) / (this.maxHeight - this.minHeight);
                this.terrainGeometry.vertices[x + y * w].z = normalizedHeight * this.scaledHeightRange();
            }
        }
        this.terrainGeometry.verticesNeedUpdate = true;
        this.terrainGeometry.computeFaceNormals();
        this.terrainGeometry.computeFlatVertexNormals();
    }
    readHeightsFromImageData(imgData) {
        let index = 0;
        const w = imgData.width;
        const h = imgData.height;
        this.minHeight = Number.MAX_VALUE;
        this.maxHeight = Number.MIN_VALUE;
        this.heights = [];
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const R = imgData.data[index];
                const G = imgData.data[index + 1];
                const B = imgData.data[index + 2];
                const height = -10000 + ((R * 256 * 256 + G * 256 + B) * 0.1);
                if (height < this.minHeight) {
                    this.minHeight = height;
                }
                if (height > this.maxHeight) {
                    this.maxHeight = height;
                }
                this.heights.push(height);
                index += 4;
            }
        }
    }
    setActive(active) {
        this.active = active;
        this.controls.enabled = active;
        ui.setMode(active ? ui.UIMode.Heightmap : ui.UIMode.Globe);
    }
    animate() {
        globals_1.raycaster.setFromCamera(globals_1.mouse, this.camera);
        this.controls.update();
        // make sure directional light follows the camera. 
        this.directionalLight.position.copy(this.camera.position);
        // orient the compass by getting the look-at direction from the 
        // regular camera direction. Flatten it on the xy plane.
        // (otherwise it can be hard to read at some angles)
        const target = new three_1.Vector3(0, 0, 0);
        this.camera.getWorldDirection(target);
        target.y = 0;
        target.z *= -1;
        target.normalize();
        this.compass.scene.lookAt(target);
    }
    render(renderer) {
        renderer.clear(true, true, true);
        // render the heightmap scene first
        renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
        renderer.render(this.scene, this.camera);
        // without clearing, render the compass scene on top.
        renderer.setViewport(0, 0, window.innerWidth / 4.0, window.innerHeight / 4.0);
        renderer.render(this.compassScene, this.compassCamera);
    }
}
exports.HeightmapScene = HeightmapScene;
