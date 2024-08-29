import Geometry from "./Geometry.js";

export default class Grass {
  constructor({ height = 0.2, x, y, color = 0x00aa00 }) {
    this.mesh = Geometry.box({ height, color });
    this.mesh.name = "Grass";
    this.mesh.receiveShadow = true;
    this.mesh.position.set(x, -height / 2, y);
  }
}
