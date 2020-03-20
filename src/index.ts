import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { Vector2 } from "three";

//missing .d.ts so use the old school require syntax
const tilebelt: any = require('@mapbox/tilebelt');

const accessToken = 'pk.eyJ1IjoiaWFub3ZlcmdhcmQiLCJhIjoiY2s3eXpnc2VsMDB3djNsc2MyeWc0Y3BseSJ9.3BJgWc7kIFflz-t7enxvAQ';

/* 
    This is assuming a UVMap from the NASA blue-marble collection
    mapped to a standard UV sphere. 

    This number might be approximate? It seems to roughly align with
    where things should be, but I haven't looked closely into 
    specific projections etc. 
*/
function sphereUVtoLatLon(uv: Vector2): Vector2 {
    const lat: number = (uv.y - 0.5) * -180;
    const lon: number = (uv.x - 0.5) * 360;
    return new Vector2(lon, lat)
}

function loadTileFromLatLon(latLon: Vector2, zoom: number, targetImage: HTMLImageElement) {
    const tile = tilebelt.pointToTile(latLon.x, latLon.y, zoom)
    const [tx, ty, tz] = tile;    
    let apiUrl = `https://api.mapbox.com/v4/mapbox.terrain-rgb/${tz}/${tx}/${ty}.pngraw?access_token=${accessToken}`;
    console.log(apiUrl);
    targetImage.src = apiUrl;
}

function main() {
    // scene objects
    const gltfLoader = new GLTFLoader()
    const cubeLoader = new THREE.CubeTextureLoader();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.05, 1000 );
    const raycaster = new THREE.Raycaster();
    let planetScene: GLTF;
    let mouse = new THREE.Vector2();

    // some relevent dom objects
    const tilePreview: HTMLImageElement = document.getElementById('tilepreview') as HTMLImageElement;
    const inputLon: HTMLInputElement = document.getElementById('lon') as HTMLInputElement;
    const inputLat: HTMLInputElement = document.getElementById('lat') as HTMLInputElement;
    const inputZoom: HTMLInputElement = document.getElementById('zoom') as HTMLInputElement;
    const inputform: HTMLFormElement = document.getElementById('heightfield-inputs') as HTMLFormElement;
    
    inputform.onsubmit = (e: Event) => {
        console.log('on submit')
        e.preventDefault();
        reloadPreview();
        return false;
    }

    function reloadPreview() {
        const lat = parseFloat(inputLat.value)
        const lon = parseFloat(inputLon.value)
        const zoom = parseInt(inputZoom.value);
        loadTileFromLatLon(new Vector2(lon, lat), zoom, tilePreview);
    }
        
    inputLon.onblur = () => { reloadPreview(); };
    inputLat.onblur = () => { reloadPreview(); };
    inputZoom.onblur = () => { reloadPreview(); };

    const skybox = cubeLoader.load([
      'assets/skybox/right.png',
      'assets/skybox/left.png',
      'assets/skybox/top.png',
      'assets/skybox/bottom.png',
      'assets/skybox/front.png',
      'assets/skybox/back.png',
    ]);
    scene.background = skybox;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight( 0xffffff, 1.5 );
    scene.add(directionalLight);

    // add a sphere for the atmosphere halo
    let geometry = new THREE.SphereGeometry(0.975, 60, 30);
    let material = new THREE.ShaderMaterial({
        vertexShader: document.getElementById('halo-vs')!.textContent!,
        fragmentShader: document.getElementById('halo-fs')!.textContent!,
        transparent: true
    })
    let sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor('#001122');
    document.body.appendChild( renderer.domElement );

    const controls = new OrbitControls( camera, renderer.domElement );

    camera.position.set(0, 0, 5);
    controls.update();
    directionalLight.position.copy(camera.position);

    gltfLoader.load('assets/earth.glb', (gltf: GLTF) => {
        scene.add(gltf.scene);
        planetScene = gltf;
        console.log(scene);
    }, undefined, (errorEvent: ErrorEvent) => {
        console.error(errorEvent);
    });
 

    function onMouseMove( event: MouseEvent ) {
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    }

    window.addEventListener( 'mousemove', onMouseMove, false );

    function onWindowResize(){
    
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    
        renderer.setSize( window.innerWidth, window.innerHeight );
    
    }

    window.addEventListener( 'resize', onWindowResize, false );

    tilePreview.onerror = () => {
        tilePreview.src = 'https://upload.wikimedia.org/wikipedia/it/3/39/Sad_mac.jpg'
    }

    renderer.domElement.addEventListener( 'dblclick', (ev: MouseEvent) => {
        if(!planetScene) {
            return;
        }

        var collisions = raycaster.intersectObjects( planetScene.scene.children, true);
        if(collisions.length > 0) {
            //just grab the first intersection
            const hit = collisions[0];
            const latLon = sphereUVtoLatLon(hit.uv!);
            inputLon.value = latLon.x.toString();
            inputLat.value = latLon.y.toString();
            reloadPreview();
        }
    })

    
    const animate = () => {
        requestAnimationFrame( animate );
        raycaster.setFromCamera( mouse, camera );  
        
        controls.update();
        directionalLight.position.copy(camera.position);
        renderer.render( scene, camera );
    };

    animate();
}
 
main();