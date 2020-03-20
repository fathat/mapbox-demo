import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { Vector2 } from "three";

//missing a .d.ts for this module so use the old school require syntax
const TileBelt: any = require('@mapbox/tilebelt');

const accessToken = 'pk.eyJ1IjoiaWFub3ZlcmdhcmQiLCJhIjoiY2s3eXpnc2VsMDB3djNsc2MyeWc0Y3BseSJ9.3BJgWc7kIFflz-t7enxvAQ';

// threejs globals
const gltfLoader = new GLTFLoader()
const textureLoader = new THREE.TextureLoader();
const cubeLoader = new THREE.CubeTextureLoader();
const raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

// some relevent dom objects
const tilePreview: HTMLImageElement = document.getElementById('tilepreview') as HTMLImageElement;
const inputLon: HTMLInputElement = document.getElementById('lon') as HTMLInputElement;
const inputLat: HTMLInputElement = document.getElementById('lat') as HTMLInputElement;
const inputZoom: HTMLInputElement = document.getElementById('zoom') as HTMLInputElement;
const inputform: HTMLFormElement = document.getElementById('heightfield-inputs') as HTMLFormElement;

interface ILocation {
    lat: number
    lon: number
    zoom: number
}

class Location implements ILocation {
    constructor(public lat: number, public lon: number, public zoom: number) {}
}

function currentLocation() {
    return new Location(
        parseFloat(inputLat.value),
        parseFloat(inputLon.value),
        parseInt(inputZoom.value)
    );
}

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

function loadTileFromLatLonIntoImage(location: ILocation, targetImage: HTMLImageElement) {
    const tile = TileBelt.pointToTile(location.lon, location.lat, location.zoom);
    const [tx, ty, tz] = tile;    
    let apiUrl = `https://api.mapbox.com/v4/mapbox.terrain-rgb/${tz}/${tx}/${ty}.pngraw?access_token=${accessToken}`;
    targetImage.src = apiUrl;
}

function reloadPreview() {
    loadTileFromLatLonIntoImage(currentLocation(), tilePreview);
}

interface IScene {
    setActive(active: boolean): any
    animate(): any
    render(renderer: THREE.WebGLRenderer): any
}

class GlobeScene implements IScene {
    active: boolean = false;

    scene: THREE.Scene
    camera: THREE.PerspectiveCamera;
    planetScene?: GLTF;
    controls: OrbitControls;
    directionalLight: THREE.DirectionalLight;
    ambientLight: THREE.AmbientLight;

    constructor(renderer: THREE.WebGLRenderer) {
        // scene objects
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.05, 1000 );

        // start loading earth model
        gltfLoader.load('assets/earth.glb', (gltf: GLTF) => {
            this.scene.add(gltf.scene);
            this.planetScene = gltf;
            console.log(this.scene);
        }, undefined, (errorEvent: ErrorEvent) => {
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
        this.directionalLight = new THREE.DirectionalLight( 0xffffff, 1.5 );
        this.scene.add(this.directionalLight);

        // add a sphere for the atmosphere halo
        let geometry = new THREE.SphereGeometry(0.975, 60, 30);
        let material = new THREE.ShaderMaterial({
            vertexShader: document.getElementById('halo-vs')!.textContent!,
            fragmentShader: document.getElementById('halo-fs')!.textContent!,
            transparent: true
        })
        let sphere = new THREE.Mesh(geometry, material);
        this.scene.add(sphere);

        this.controls = new OrbitControls( this.camera, renderer.domElement );
        this.controls.enabled = false;

        this.camera.position.set(0, 0, 4);
        this.controls.update();
        this.directionalLight.position.copy(this.camera.position);
        
        const onWindowResize = () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        }
        window.addEventListener( 'resize', onWindowResize, false );

        renderer.domElement.addEventListener( 'dblclick', (ev: MouseEvent) => {
            if(!this.planetScene || !this.active) {
                return;
            }
            var collisions = raycaster.intersectObjects( this.planetScene.scene.children, true);
            if(collisions.length > 0) {
                //just grab the first intersection
                const hit = collisions[0];
                const latLon = sphereUVtoLatLon(hit.uv!);
                inputLon.value = latLon.x.toString();
                inputLat.value = latLon.y.toString();
                reloadPreview();
            }
        })
    
    }
    
    setActive(active: boolean) {
        this.active = active;
        this.controls.enabled = active;
    }

    animate() {
        raycaster.setFromCamera( mouse, this.camera );        
        this.controls.update();
        this.directionalLight.position.copy(this.camera.position);
    }

    render(renderer: THREE.WebGLRenderer) {
        renderer.render( this.scene, this.camera );
    }
}

class HeightmapScene implements IScene {
      
    active: boolean = false;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    ambientLight: THREE.AmbientLight;
    directionalLight: THREE.DirectionalLight;
    controls: OrbitControls;
    plane?: THREE.Mesh;
    planeMaterial?: THREE.Material;
    planeGeometry?: THREE.PlaneGeometry;
    wireMesh?: THREE.LineSegments;
    
    constructor(renderer: THREE.WebGLRenderer) {
        // scene objects
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.05, 1000 );
                
        const skybox = cubeLoader.load([
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
        this.directionalLight = new THREE.DirectionalLight( 0xffffff, 1.5 );
        this.scene.add(this.directionalLight);

        // test box
        let geometry = new THREE.BoxGeometry(5, 5, 5);
        let material = new THREE.MeshStandardMaterial({color: 0xff0000 });
        let box = new THREE.Mesh(geometry, material);
        this.scene.add(box);
        
        // plane       
        this.rebuildWiremesh();       
       
        //this.planeMaterial = new THREE.MeshStandardMaterial({color: 0x00ff00})
        //this.plane = new THREE.Mesh(this.planeGeometry, this.planeMaterial);
        //this.plane.setRotationFromEuler(new THREE.Euler(-90 * (3.14159 / 180.0), 0, 0));
        //this.scene.add(this.plane);

        this.controls = new OrbitControls( this.camera, renderer.domElement );
        this.controls.enabled = false;

        this.camera.position.set(0, 128, 128);
        this.controls.update();
        this.directionalLight.position.copy(this.camera.position);
        
        const onWindowResize = () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        }
        window.addEventListener( 'resize', onWindowResize, false );
    }

    public rebuildWiremesh() {
        if(this.wireMesh) {
            this.scene.remove(this.wireMesh);
        }

        if(this.plane) {
            this.scene.remove(this.plane);
        }

        let img = new Image();
        img.crossOrigin = "Anonymous";

        img.onload = (event: Event) => {                       
            const w = img.width;
            const h = img.height;
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            
            let context = canvas.getContext('2d');
            context!.drawImage(img, 0, 0);

            textureLoader.load(canvas.toDataURL(),
                (texture: THREE.Texture) => {
                    const imgData = context!.getImageData(0, 0, w, h);
                    console.log(imgData);
                    this.planeGeometry = new THREE.PlaneGeometry(w, h, w-1, h-1);
                    let index = 0;

                    let minHeight = Number.MAX_VALUE;
                    let maxHeight = Number.MIN_VALUE;

                    let heights: number[] = [];
                    for(let y=0; y<h; y++) {
                        for(let x=0; x<w; x++) {
                            const R = imgData.data[index];
                            const G = imgData.data[index+1];
                            const B = imgData.data[index+2];

                            const height = -10000 + ((R * 256 * 256 + G * 256 + B) * 0.1);

                            if(height < minHeight) {
                                minHeight = height;
                            }

                            if(height > maxHeight) {
                                maxHeight = height;
                            }

                            heights.push(height);
                            index += 4;
                        }
                    }

                    for(let y=0; y<h; y++) {
                        for(let x=0; x<w; x++) {
                            const height = heights[x+y*w];
                            const normalizedHeight = (height - minHeight) / (maxHeight-minHeight);
                            this.planeGeometry.vertices[x + y * w].z = normalizedHeight * 32.0;
                            const color = new THREE.Color(
                                imgData.data[x*4 + y*w*4],
                                imgData.data[x*4 + y*w*4+1],
                                imgData.data[x*4 + y*w*4+2]
                            )
                            this.planeGeometry.colors.push(color);
                        }
                    }
                    
                    this.planeGeometry.verticesNeedUpdate = true;
                    this.planeGeometry.colorsNeedUpdate = true;
                    this.planeGeometry.computeFaceNormals();
                    this.planeGeometry.computeFlatVertexNormals();
                                
                    //let wireframe = new THREE.WireframeGeometry(this.planeGeometry);
                    //this.wireMesh = new THREE.LineSegments(wireframe);
                    //this.wireMesh.setRotationFromEuler(new THREE.Euler(-90 * (3.14159 / 180.0), 0, 0));
                    //this.scene.add(this.wireMesh);

                    this.planeMaterial = new THREE.MeshLambertMaterial({map: texture, color: 0xffffff})
                    this.planeMaterial.vertexColors = true;
                    this.planeMaterial.side = THREE.DoubleSide;
                    
                    this.plane = new THREE.Mesh(this.planeGeometry, this.planeMaterial);
                    this.plane.setRotationFromEuler(new THREE.Euler(-90 * (3.14159 / 180.0), 0, 0));
                    this.scene.add(this.plane)

                }
            );
        };

        loadTileFromLatLonIntoImage(currentLocation(), img);
    }

    setActive(active: boolean) {
        this.active = active;
        this.controls.enabled = active;
    }

    animate() {
        raycaster.setFromCamera( mouse, this.camera );        
        this.controls.update();
        this.directionalLight.position.copy(this.camera.position);
    }

    render(renderer: THREE.WebGLRenderer) {
        renderer.render( this.scene, this.camera );
    }
}


function main() {
 
    
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor('#001122');
    document.body.appendChild( renderer.domElement );
    
    function onMouseMove( event: MouseEvent ) {
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    }
    window.addEventListener( 'mousemove', onMouseMove, false );

    const onWindowResize = () => {
        renderer.setSize( window.innerWidth, window.innerHeight );
    }
    window.addEventListener( 'resize', onWindowResize, false );


    tilePreview.onerror = () => {
        tilePreview.src = 'https://upload.wikimedia.org/wikipedia/it/3/39/Sad_mac.jpg'
    }

    
    const globeScene = new GlobeScene(renderer);
    globeScene.setActive(true);
    const heightmapScene = new HeightmapScene(renderer);
    
    const scenes: IScene[] = [globeScene, heightmapScene];
    let currentScene: IScene = globeScene;
    
    const switchScene = (scene: IScene) => {
        for(const scn of scenes) {
            scn.setActive(false);
        }
        scene.setActive(true);
        currentScene = scene;
    }

    document.getElementById("view-globe-btn")!.onclick = () => {
        switchScene(globeScene);
    };

    document.getElementById("view-heightmap-btn")!.onclick = () => {
        switchScene(heightmapScene);
    };

    inputform.onsubmit = (e: Event) => {
        console.log('on submit')
        e.preventDefault();
        reloadPreview();
        heightmapScene.rebuildWiremesh();
        return false;
    }
        
    inputLon.onblur = () => { reloadPreview(); };
    inputLat.onblur = () => { reloadPreview(); };
    inputZoom.onblur = () => { reloadPreview(); };

    const animate = () => {
        requestAnimationFrame( animate );
        currentScene.animate();
        currentScene.render(renderer);
    }
    animate();
}
 
main();