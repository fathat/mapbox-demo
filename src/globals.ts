import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as THREE from "three";

// threejs globals
export const gltfLoader = new GLTFLoader()
export const textureLoader = new THREE.TextureLoader();
export const cubeLoader = new THREE.CubeTextureLoader();
export const raycaster = new THREE.Raycaster();
export let mouse = new THREE.Vector2();