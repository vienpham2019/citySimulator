import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export default class Building {
  static base = { x: 1, z: 1 };
  constructor({ modelUrl, isPreview = false, scale = { x: 1, y: 1, z: 1 } }) {
    this.isPreview = isPreview;
    this.modelUrl = modelUrl;
    this.scale = scale;
  }

  setIsCollision(isColision) {
    if (!this.isPreview) return;
    let color = 0x808080;
    if (isColision) color = 0xff0000; // red
    this.mesh.traverse((obj) => {
      if (obj.material) obj.material.color.set(new THREE.Color(color));
    });
  }

  rotate({ x, y, z }) {
    if (x) this.mesh.rotation.x += THREE.MathUtils.degToRad(x);
    if (y) this.mesh.rotation.y += THREE.MathUtils.degToRad(y);
    if (z) this.mesh.rotation.z += THREE.MathUtils.degToRad(z);
  }

  setRotate({ x, y, z }) {
    if (x) this.mesh.rotation.x = THREE.MathUtils.degToRad(x);
    if (y) this.mesh.rotation.y = THREE.MathUtils.degToRad(y);
    if (z) this.mesh.rotation.z = THREE.MathUtils.degToRad(z);
  }

  isColision(target) {
    const thisBoundingBox = new THREE.Box3().setFromObject(this.mesh);
    const targetBoundingBox = new THREE.Box3().setFromObject(target.mesh);
    // return targetBoundingBox.intersectsBox(thisBoundingBox);
    return false;
  }

  static async create({ obj, position }) {
    try {
      obj.mesh = await obj.loadGLTF({ position });
      return obj;
    } catch (error) {
      console.error("An error occurred while loading the model:", error);
    }
  }

  async loadGLTF({ position }) {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.load(
        this.modelUrl,
        (gltf) => {
          const mesh = gltf.scene;
          mesh.position.set(position.x, 0.2, position.y);
          mesh.traverse((obj) => {
            if (obj.material) {
              obj.receiveShadow = true;
              if (this.isPreview) {
                obj.material.color.set(new THREE.Color(0x808080));
              } else {
                obj.material = new THREE.MeshLambertMaterial({
                  map: Building.loadTexture("../textures/base.png"),
                  specularMap: Building.loadTexture("../textures/specular.png"),
                });
                obj.castShadow = true;
              }
            }
          });
          mesh.scale.set(
            this.scale.x / 30,
            this.scale.y / 30,
            this.scale.z / 30
          );
          resolve(mesh);
          // Resolve the promise with the loaded mesh
        },
        undefined,
        (error) => {
          console.error(error);
        }
      );
    });
  }

  static loadTexture(url, flipY = false) {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(url);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = flipY;
    return texture;
  }
}
