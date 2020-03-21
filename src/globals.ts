import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import * as THREE from "three";


// threejs globals
export const gltfLoader = new GLTFLoader()
export const textureLoader = new THREE.TextureLoader();
export const cubeLoader = new THREE.CubeTextureLoader();
export const raycaster = new THREE.Raycaster();
export let mouse = new THREE.Vector2();

export const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath( 'assets/draco/' );
gltfLoader.setDRACOLoader( dracoLoader );