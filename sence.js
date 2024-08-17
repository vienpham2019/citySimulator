import * as THREE from "three";
const w = window.innerWidth;
const h = window.innerHeight;

export default class Scene {
  constructor({ width = 10 }) {
    // Initialize scene, camera, and renderer
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
    this.camera.position.z = width;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(w, h);

    // Append renderer to the DOM
    document.body.appendChild(this.renderer.domElement);
    this.setupLights();
  }

  setupLights() {
    const lights = [
      new THREE.AmbientLight(0xffffff, 0.2),
      new THREE.DirectionalLight(0xffffff, 0.3),
      new THREE.DirectionalLight(0xffffff, 0.3),
      new THREE.DirectionalLight(0xffffff, 0.3),
    ];
    lights[1].position.set(0, 1, 0);
    lights[2].position.set(1, 1, 0);
    lights[3].position.set(0, 1, 1);

    this.scene.add(...lights);
  }

  draw = (buildings) => {
    this.renderer.render(this.scene, this.camera);
    for (let building of buildings) {
      if (building.height < building.maxHeight) building.grow();
    }
  };

  start(buildings) {
    this.renderer.setAnimationLoop(() => this.draw(buildings));
  }

  stop() {
    this.renderer.setAnimationLoop(null);
  }
}
