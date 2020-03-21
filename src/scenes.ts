import { IScene } from "./scene";
import { HeightmapScene } from "./heightmapscene";
import { GlobeScene } from "./globescene";

export class SceneManager {

    public globeScene: GlobeScene;
    public heightmapScene: HeightmapScene;

    scenes: IScene[] = [];
    currentScene: IScene;

    constructor(renderer: THREE.WebGLRenderer) {
        this.globeScene = new GlobeScene(renderer);
        this.globeScene.setActive(true);
        this.heightmapScene = new HeightmapScene(renderer);
        this.scenes = [this.globeScene, this.heightmapScene];
        this.currentScene = this.globeScene;
    }

    switchScene(scene: IScene) {
        for (const scn of this.scenes) {
            scn.setActive(false);
        }
        scene.setActive(true);
        this.currentScene = scene;
    }

    animate() {
        this.currentScene.animate();
    }
    
    render(renderer: THREE.WebGLRenderer) {
        this.currentScene.render(renderer);
    }
}
