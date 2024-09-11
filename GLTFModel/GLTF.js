import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export default class GLTF {
  static base = { x: 1, z: 1 };

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
    if (y)
      this.mesh.rotation.y = parseFloat(THREE.MathUtils.degToRad(y)).toFixed(2);
    if (z) this.mesh.rotation.z = THREE.MathUtils.degToRad(z);
  }

  isColision(target) {
    const thisBoundingBox = new THREE.Box3().setFromObject(this.mesh);
    const targetBoundingBox = new THREE.Box3().setFromObject(target.mesh);
    return targetBoundingBox.intersectsBox(thisBoundingBox);
  }

  static async create({ obj, position }) {
    try {
      obj.mesh = await GLTF.#loadGLTF({ position, obj });
      return obj;
    } catch (error) {
      console.error("An error occurred while loading the model:", error);
    }
  }

  static #loadGLTF({ position, obj }) {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.load(
        obj.modelUrl,
        (gltf) => {
          const mesh = gltf.scene;
          mesh.position.set(position.x, position.y, position.z);
          mesh.traverse((child) => {
            if (child.material) {
              child.receiveShadow = true;
              if (obj.isPreview) {
                child.material.color.set(new THREE.Color(0x808080));
              } else {
                child.material = new THREE.MeshLambertMaterial({
                  map: GLTF.loadTexture("../textures/base.png"),
                  specularMap: GLTF.loadTexture("../textures/specular.png"),
                });
                child.castShadow = true;
              }
            }
          });
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
