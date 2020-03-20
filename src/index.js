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
const GLTFLoader_1 = require("three/examples/jsm/loaders/GLTFLoader");
const three_1 = require("three");
//missing a .d.ts for this module so use the old school require syntax
const TileBelt = require('@mapbox/tilebelt');
const accessToken = 'pk.eyJ1IjoiaWFub3ZlcmdhcmQiLCJhIjoiY2s3eXpnc2VsMDB3djNsc2MyeWc0Y3BseSJ9.3BJgWc7kIFflz-t7enxvAQ';
// threejs globals
const gltfLoader = new GLTFLoader_1.GLTFLoader();
const cubeLoader = new THREE.CubeTextureLoader();
const raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
// some relevent dom objects
const tilePreview = document.getElementById('tilepreview');
const inputLon = document.getElementById('lon');
const inputLat = document.getElementById('lat');
const inputZoom = document.getElementById('zoom');
const inputform = document.getElementById('heightfield-inputs');
class Location {
    constructor(lat, lon, zoom) {
        this.lat = lat;
        this.lon = lon;
        this.zoom = zoom;
    }
}
function currentLocation() {
    return new Location(parseFloat(inputLat.value), parseFloat(inputLon.value), parseInt(inputZoom.value));
}
/*
    This is assuming a UVMap from the NASA blue-marble collection
    mapped to a standard UV sphere.

    This number might be approximate? It seems to roughly align with
    where things should be, but I haven't looked closely into
    specific projections etc.
*/
function sphereUVtoLatLon(uv) {
    const lat = (uv.y - 0.5) * -180;
    const lon = (uv.x - 0.5) * 360;
    return new three_1.Vector2(lon, lat);
}
function loadTileFromLatLonIntoImage(location, targetImage) {
    const tile = TileBelt.pointToTile(location.lon, location.lat, location.zoom);
    const [tx, ty, tz] = tile;
    let apiUrl = `https://api.mapbox.com/v4/mapbox.terrain-rgb/${tz}/${tx}/${ty}.pngraw?access_token=${accessToken}`;
    targetImage.src = apiUrl;
}
function reloadPreview() {
    loadTileFromLatLonIntoImage(currentLocation(), tilePreview);
}
class GlobeScene {
    constructor(renderer) {
        this.active = false;
        // scene objects
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 1000);
        // start loading earth model
        gltfLoader.load('assets/earth.glb', (gltf) => {
            this.scene.add(gltf.scene);
            this.planetScene = gltf;
            console.log(this.scene);
        }, undefined, (errorEvent) => {
            console.error(errorEvent);
        });
        const skybox = cubeLoader.load([
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
        // add a sphere for the atmosphere halo
        let geometry = new THREE.SphereGeometry(0.975, 60, 30);
        let material = new THREE.ShaderMaterial({
            vertexShader: document.getElementById('halo-vs').textContent,
            fragmentShader: document.getElementById('halo-fs').textContent,
            transparent: true
        });
        let sphere = new THREE.Mesh(geometry, material);
        this.scene.add(sphere);
        this.controls = new OrbitControls_js_1.OrbitControls(this.camera, renderer.domElement);
        this.controls.enabled = false;
        this.camera.position.set(0, 0, 4);
        this.controls.update();
        this.directionalLight.position.copy(this.camera.position);
        const onWindowResize = () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        };
        window.addEventListener('resize', onWindowResize, false);
        renderer.domElement.addEventListener('dblclick', (ev) => {
            if (!this.planetScene || !this.active) {
                return;
            }
            var collisions = raycaster.intersectObjects(this.planetScene.scene.children, true);
            if (collisions.length > 0) {
                //just grab the first intersection
                const hit = collisions[0];
                const latLon = sphereUVtoLatLon(hit.uv);
                inputLon.value = latLon.x.toString();
                inputLat.value = latLon.y.toString();
                reloadPreview();
            }
        });
    }
    setActive(active) {
        this.active = active;
        this.controls.enabled = active;
    }
    animate() {
        raycaster.setFromCamera(mouse, this.camera);
        this.controls.update();
        this.directionalLight.position.copy(this.camera.position);
    }
    render(renderer) {
        renderer.render(this.scene, this.camera);
    }
}
class HeightmapScene {
    constructor(renderer) {
        this.active = false;
        // scene objects
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 1000);
        const skybox = cubeLoader.load([
            'assets/ground-skybox/right.png',
            'assets/ground-skybox/left.png',
            'assets/ground-skybox/top.png',
            'assets/ground-skybox/bottom.png',
            'assets/ground-skybox/front.png',
            'assets/ground-skybox/back.png',
        ]);
        this.scene.background = skybox;
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
        this.scene.add(this.ambientLight);
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        this.scene.add(this.directionalLight);
        // test sphere
        let geometry = new THREE.SphereGeometry(0.975, 60, 30);
        let material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        let sphere = new THREE.Mesh(geometry, material);
        this.scene.add(sphere);
        this.controls = new OrbitControls_js_1.OrbitControls(this.camera, renderer.domElement);
        this.controls.enabled = false;
        this.camera.position.set(0, 0, 4);
        this.controls.update();
        this.directionalLight.position.copy(this.camera.position);
        const onWindowResize = () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        };
        window.addEventListener('resize', onWindowResize, false);
    }
    setActive(active) {
        this.active = active;
        this.controls.enabled = active;
    }
    animate() {
        raycaster.setFromCamera(mouse, this.camera);
        this.controls.update();
        this.directionalLight.position.copy(this.camera.position);
    }
    render(renderer) {
        renderer.render(this.scene, this.camera);
    }
}
function main() {
    inputform.onsubmit = (e) => {
        console.log('on submit');
        e.preventDefault();
        reloadPreview();
        return false;
    };
    inputLon.onblur = () => { reloadPreview(); };
    inputLat.onblur = () => { reloadPreview(); };
    inputZoom.onblur = () => { reloadPreview(); };
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor('#001122');
    document.body.appendChild(renderer.domElement);
    function onMouseMove(event) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
    window.addEventListener('mousemove', onMouseMove, false);
    const onWindowResize = () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onWindowResize, false);
    tilePreview.onerror = () => {
        tilePreview.src = 'https://upload.wikimedia.org/wikipedia/it/3/39/Sad_mac.jpg';
    };
    const globeScene = new GlobeScene(renderer);
    globeScene.setActive(true);
    const heightmapScene = new HeightmapScene(renderer);
    const scenes = [globeScene, heightmapScene];
    let currentScene = globeScene;
    const switchScene = (scene) => {
        for (const scn of scenes) {
            scn.setActive(false);
        }
        scene.setActive(true);
        currentScene = scene;
    };
    document.getElementById("view-globe-btn").onclick = () => {
        switchScene(globeScene);
    };
    document.getElementById("view-heightmap-btn").onclick = () => {
        switchScene(heightmapScene);
    };
    const animate = () => {
        requestAnimationFrame(animate);
        currentScene.animate();
        currentScene.render(renderer);
    };
    animate();
}
main();
