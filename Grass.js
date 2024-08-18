import Geometry from "./Geometry.js";

export default class Grass extends Geometry {
  constructor({ height = 0.2, x, y, color = 0x00aa00 }) {
    super({ height, color });
    this.mesh.name = "Grass";
    this.mesh.receiveShadow = true;
    this.mesh.position.set(x, -height / 2, y);
  }
}
