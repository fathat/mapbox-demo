import * as THREE from "three";
import * as ui from "./uielements";
import { mouse } from "./globals";
import { SceneManager } from "./scenes";

let sceneManager: SceneManager;

function main() {
    
    // Create renderer. Note that we set auto-clear
    // to false because the heightmap scene needs to composite
    // multiple render calls.
    const renderer = new THREE.WebGLRenderer();
    renderer.autoClear = false;
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor('#001122');
    document.body.appendChild( renderer.domElement );
    
    // Track mouse coordinates, as normalized device coordinates
    // (for ray-casting)
    function onMouseMove( event: MouseEvent ) {
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    }
    window.addEventListener( 'mousemove', onMouseMove, false );

    // Make sure to resize renderer on browser resize.
    const onWindowResize = () => {
        renderer.setSize( window.innerWidth, window.innerHeight );
    }
    window.addEventListener( 'resize', onWindowResize, false );

    sceneManager = new SceneManager(renderer);

    // Hook up the back button to bring us back to the globe scene
    // (this button is only visible from the heightmap scene)
    document.getElementById("view-globe-btn")!.onclick = () => {
        sceneManager.switchScene(sceneManager.globeScene);
    };

    // hook up the "view heightfield" button
    ui.inputform.onsubmit = (e: Event) => {
        e.preventDefault();
        sceneManager.heightmapScene.rebuildMesh(renderer);
        sceneManager.switchScene(sceneManager.heightmapScene);
        return false;
    }
    
    // hide elements specific to the heightmap scene by default.
    ui.setMode(ui.UIMode.Globe);

    // start the update loop
    const animate = () => {
        requestAnimationFrame( animate );
        sceneManager.animate();
        sceneManager.render(renderer);
    }
    animate();
}
 
main();