import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { Vector2 } from "three";

function main() {
    const loader = new GLTFLoader()
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
    
    const cubeLoader = new THREE.CubeTextureLoader();
    const skybox = cubeLoader.load([
      'assets/skybox/right.png',
      'assets/skybox/left.png',
      'assets/skybox/top.png',
      'assets/skybox/bottom.png',
      'assets/skybox/front.png',
      'assets/skybox/back.png',
    ]);
    scene.background = skybox;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight( 0xffffff, 1.5 );
    scene.add( directionalLight );

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor('#001122');
    document.body.appendChild( renderer.domElement );

    const controls = new OrbitControls( camera, renderer.domElement );

    camera.position.set(0, 0, 5);
    controls.update();
    directionalLight.position.copy(camera.position);

    let planetScene: GLTF;

    loader.load('assets/earth.glb', (gltf: GLTF) => {
        scene.add(gltf.scene);
        planetScene = gltf;
        console.log(scene);
    }, undefined, (errorEvent: ErrorEvent) => {
        console.error(errorEvent);
    })

    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();

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

    function uvToLatLon(uv: Vector2): Vector2 {
        const lat: number = (uv.y - 0.5) * -180;
        const lon: number = (uv.x - 0.5) * 360;
        return new Vector2(lon, lat)
    }

    const animate = () => {
        requestAnimationFrame( animate );
        raycaster.setFromCamera( mouse, camera );

        if(planetScene) {
            var intersects = raycaster.intersectObjects( scene.children, true);
            if(intersects.length > 0) {
                //just grab the first intersection
                const hit = intersects[0];
                const latLon = uvToLatLon(hit.uv!);

                (document.getElementById('lon') as any).value = latLon.x;
                (document.getElementById('lat') as any).value = latLon.y;

            }
        }
        
        controls.update();
        renderer.render( scene, camera );
    };

    animate();
}
 
main();