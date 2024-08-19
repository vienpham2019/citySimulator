import { OrbitControls } from "jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as THREE from "three";

import Scene from "./sence.js";
import Grass from "./Grass.js";
import Building from "./Building.js";

const width = 20;
const length = 20;
const myScene = new Scene({ width, length });

new OrbitControls(myScene.camera, myScene.renderer.domElement);
// const loader = new GLTFLoader();
// const textureLoader = new THREE.TextureLoader();
// loader.load("./models/industry-factory-old.glb", (gltf) => {
//   const mesh = gltf.scene;
//   mesh.position.set(1.5, 0, 1.5);
//   mesh.traverse((obj) => {
//     if (obj.material) {
//       obj.material = new THREE.MeshLambertMaterial({
//         map: loadTexture("./textures/base.png"),
//         specularMap: loadTexture("./textures/specular.png"),
//       });

//       obj.receiveShadow = true;
//       obj.castShadow = true;
//       //   obj.material.transparent = true;
//     }
//   });
//   //   mesh.rotation.set(0, THREE.MathUtils.degToRad(30), 0);
//   mesh.scale.set(2 / 30, 2 / 30, 2 / 30);

//   myScene.scene.add(mesh);
//   //   this.scene.add(mesh);
// });

// loader.load("./models/building-block-5floor-front.glb", (gltf) => {
//   const mesh = gltf.scene;
//   mesh.position.set(-1, 0, 1);
//   mesh.traverse((obj) => {
//     if (obj.material) {
//       obj.material = new THREE.MeshLambertMaterial({
//         map: loadTexture("./textures/base.png"),
//         specularMap: loadTexture("./textures/specular.png"),
//       });

//       obj.receiveShadow = true;
//       obj.castShadow = true;
//       //   obj.material.transparent = true;
//     }
//   });
//   //   mesh.rotation.set(0, THREE.MathUtils.degToRad(30), 0);
//   mesh.scale.set(2 / 30, 2 / 30, 2 / 30);

//   myScene.scene.add(mesh);
//   //   this.scene.add(mesh);
// });

// function loadTexture(url, flipY = false) {
//   const texture = textureLoader.load(url);
//   texture.colorSpace = THREE.SRGBColorSpace;
//   texture.flipY = flipY;
//   return texture;
// }

window.onload = () => {
  myScene.start();
};

document.body.addEventListener(
  "mousedown",
  (event) => {
    myScene.onSelectObject(event);
  },
  false
);

document.body.addEventListener(
  "mousemove",
  (event) => {
    myScene.onHoverObject(event);
  },
  false
);
