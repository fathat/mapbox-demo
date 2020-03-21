export interface IScene {
    setActive(active: boolean): any
    animate(): any
    render(renderer: THREE.WebGLRenderer): any
}
