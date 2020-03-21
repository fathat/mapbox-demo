"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const GLTFLoader_1 = require("three/examples/jsm/loaders/GLTFLoader");
const THREE = __importStar(require("three"));
// threejs globals
exports.gltfLoader = new GLTFLoader_1.GLTFLoader();
exports.textureLoader = new THREE.TextureLoader();
exports.cubeLoader = new THREE.CubeTextureLoader();
exports.raycaster = new THREE.Raycaster();
exports.mouse = new THREE.Vector2();
