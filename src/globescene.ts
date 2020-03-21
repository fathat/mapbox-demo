import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

import { sphereUVtoLatLon, currentLocation, locationToUVbox } from "./location";
import { IScene } from "./scene";
import { gltfLoader, cubeLoader, raycaster, mouse } from "./globals";
import * as ui from "./uielements";

export class GlobeScene implements IScene {

    active: boolean = false;
    
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
       
    controls: OrbitControls;
    
    directionalLight: THREE.DirectionalLight;
    ambientLight: THREE.AmbientLight;
    
    planetModel?: GLTF;
    shaderMaterial: THREE.ShaderMaterial;

    constructor(renderer: THREE.WebGLRenderer) {
        
        // scene objects
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 1000);
        
        // start loading earth model
        gltfLoader.load('assets/earth.glb', (gltf: GLTF) => {
            this.scene.add(gltf.scene);
            this.planetModel = gltf;
        }, undefined, (errorEvent: ErrorEvent) => {
            console.error(errorEvent);
        });

        const skybox = cubeLoader.load([
            'assets/skybox/right.jpg',
            'assets/skybox/left.jpg',
            'assets/skybox/top.jpg',
            'assets/skybox/bottom.jpg',
            'assets/skybox/front.jpg',
            'assets/skybox/back.jpg',
        ]);
        this.scene.background = skybox;
        
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
        this.scene.add(this.ambientLight);
        
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        this.scene.add(this.directionalLight);
        
        // add a sphere for the atmosphere halo & selection grid
        const sphereGeometry = new THREE.SphereGeometry(0.975, 60, 30);
        this.shaderMaterial = new THREE.ShaderMaterial({
            vertexShader: document.getElementById('halo-vs')!.textContent!,
            fragmentShader: document.getElementById('halo-fs')!.textContent!,
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

        this.controls = new OrbitControls(this.camera, renderer.domElement);
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
        
        renderer.domElement.addEventListener('touchstart', (ev: TouchEvent) => {
            drag = false;
            dragStart.x = ev.touches[0].clientX;
            dragStart.y = ev.touches[0].clientY;
        });

        renderer.domElement.addEventListener('mousedown', (ev: MouseEvent) => {
            drag = false;
            dragStart.x = ev.clientX;
            dragStart.y = ev.clientY;
        });
        renderer.domElement.addEventListener('mousemove', (ev: MouseEvent) => {
            if (Math.abs(ev.clientX - dragStart.x) > 5
                || Math.abs(ev.clientY - dragStart.y) > 5) {
                drag = true;
            }
        });

        renderer.domElement.addEventListener('touchmove', (ev: TouchEvent) => {
            if (Math.abs(ev.touches[0].clientX - dragStart.x) > 5
                || Math.abs(ev.touches[0].clientY - dragStart.y) > 5) {
                drag = true;
            }
        });


        const onClick = () => {
            if (drag) {
                return;
            }
            if (!this.planetModel || !this.active) {
                return;
            }
            var collisions = raycaster.intersectObjects(this.planetModel.scene.children, true);
            if (collisions.length > 0) {
                //just grab the first intersection
                const hit = collisions[0];
                const latLon = sphereUVtoLatLon(hit.uv!);
                ui.inputLon.value = latLon.x.toString();
                ui.inputLat.value = latLon.y.toString();
                this.updateTileVisualization();
            }
        }

        renderer.domElement.addEventListener('mouseup', (ev: MouseEvent) => {
            onClick();
        });

        renderer.domElement.addEventListener('touchend', (ev: TouchEvent) => {
            if(!ev.changedTouches.length) {
                return;
            }
            const x = ( ev.changedTouches[0].clientX / window.innerWidth ) * 2 - 1;
            const y = - ( ev.changedTouches[0].clientY / window.innerHeight ) * 2 + 1;
            raycaster.setFromCamera({x, y}, this.camera)
            onClick();
        })
    }

    updateTileVisualization() {
        const loc = currentLocation();
        const box = locationToUVbox(loc);
        this.shaderMaterial.uniforms.uvHighlightRange = {
            value: box
        };
        this.shaderMaterial.uniformsNeedUpdate = true;
    }

    setActive(active: boolean) {
        this.active = active;
        this.controls.enabled = active;
    }

    animate() {
        raycaster.setFromCamera(mouse, this.camera);
        this.controls.update();
        this.directionalLight.position.copy(this.camera.position);
    }
    
    render(renderer: THREE.WebGLRenderer) {
        renderer.clear(true, true, true);
        renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
        renderer.render(this.scene, this.camera);
    }
}
