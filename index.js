import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";
import Scene from "./sence.js";

const myScene = new Scene();
new OrbitControls(myScene.camera, myScene.renderer.domElement);

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
myScene.scene.add(cube);

window.onload = () => {
  myScene.start();
};
