import * as THREE from "three";
const w = window.innerWidth;
const h = window.innerHeight;

export default class Scene {
  constructor() {
    // Initialize scene, camera, and renderer
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
    this.camera.position.z = 5;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(w, h);

    // Append renderer to the DOM
    document.body.appendChild(this.renderer.domElement);
  }

  draw = () => {
    this.renderer.render(this.scene, this.camera);
  };

  start() {
    this.renderer.setAnimationLoop(this.draw);
  }

  stop() {
    this.renderer.setAnimationLoop(null);
  }
}
