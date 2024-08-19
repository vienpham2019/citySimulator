import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const growTimeInterval = 500;
export default class Building {
  static base = { x: 2, z: 2 };
  constructor({ x, y }) {
    this.x = x;
    this.y = y;
    this.offset = { x: 0.5, y: 0.5 };
  }

  loadGLTF(callback) {
    const loader = new GLTFLoader();
    loader.load("./models/industry-factory-old.glb", (gltf) => {
      const mesh = gltf.scene;
      mesh.position.set(this.x + this.offset.x, 0, this.y + this.offset.y);
      mesh.traverse((obj) => {
        if (obj.material) {
          obj.material = new THREE.MeshLambertMaterial({
            map: this.loadTexture("./textures/base.png"),
            specularMap: this.loadTexture("./textures/specular.png"),
          });

          obj.receiveShadow = true;
          obj.castShadow = true;
          // obj.material.transparent = true;
        }
      });
      // mesh.rotation.set(0, THREE.MathUtils.degToRad(30), 0);
      mesh.scale.set(2 / 30, 2 / 30, 2 / 30);
      callback(mesh);
      // Resolve the promise with the loaded mesh
    });
  }

  loadTexture(url, flipY = false) {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(url);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = flipY;
    return texture;
  }

  grow = () => {
    if (this.height === this.maxHeight) return;
    if (--this.growTimeInterval <= 0) {
      this.growTimeInterval = growTimeInterval;
      this.height = Math.floor(++this.height);
    }
    // Replace the old geometry with the new one
    this.mesh.geometry.dispose(); // Dispose of the old geometry to free up memory
    this.mesh.geometry = new THREE.BoxGeometry(1, this.height, 1);
    this.mesh.position.y = this.height / 2;
  };
}
