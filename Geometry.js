import * as THREE from "three";

export default class Geometry {
  constructor({ height = 1, color = 0xffffff }) {
    const geometry = new THREE.BoxGeometry(1, height, 1);
    const material = new THREE.MeshLambertMaterial({ color });
    this.mesh = new THREE.Mesh(geometry, material);
  }
}
