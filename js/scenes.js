import { HeightmapScene } from "./heightmapscene";
import { GlobeScene } from "./globescene"; // This class manages switching between scenes (all two of them!)

export class SceneManager {
  scenes = [];

  constructor(renderer) {
    this.globeScene = new GlobeScene(renderer);
    this.globeScene.setActive(true);
    this.heightmapScene = new HeightmapScene(renderer);
    this.scenes = [this.globeScene, this.heightmapScene];
    this.currentScene = this.globeScene;
  }

  switchScene(scene) {
    for (const scn of this.scenes) {
      scn.setActive(false);
    }

    scene.setActive(true);
    this.currentScene = scene;
  }

  animate() {
    this.currentScene.animate();
  }

  render(renderer) {
    this.currentScene.render(renderer);
  }

}

