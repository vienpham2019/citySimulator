import * as THREE from "three";
import Geometry from "./Geometry.js";
const growTimeInterval = 500;
export default class Building extends Geometry {
  constructor({ maxHeight = 0, height = 0.1, x, y, color = 0x777777 }) {
    super({ height, color });
    this.mesh.position.set(x, 0.5, y);
    this.mesh.name = "Building";
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = false; //default
    this.height = height;
    this.maxHeight = maxHeight;
    this.growTimeInterval = growTimeInterval;
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
