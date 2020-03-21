"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const heightmapscene_1 = require("./heightmapscene");
const globescene_1 = require("./globescene");
class SceneManager {
    constructor(renderer) {
        this.scenes = [];
        this.globeScene = new globescene_1.GlobeScene(renderer);
        this.globeScene.setActive(true);
        this.heightmapScene = new heightmapscene_1.HeightmapScene(renderer);
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
exports.SceneManager = SceneManager;
