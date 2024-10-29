import Geometry from "../Geometry.js";
import NodeInstance from "./NodeInstance.js";

export default class Point extends NodeInstance {
  constructor({ maxInstance, name = "Point", color = 0xffffff }) {
    super({ maxInstance });
    this.name = name;
    this.mesh = Geometry.point({
      position: { x: 0, y: 0, z: 0 },
      color,
    });
  }

  static async create({ maxInstance = 10, color = "White", name = "Point" }) {
    const colorToHex = {
      White: 0xffffff,
      Green: 0x00ff00,
      Red: 0xff0000,
    };
    const obj = new Point({ maxInstance, name, color: colorToHex[color] });
    obj.createInstanceMesh();
    obj.updateInstanceMeshPosition({
      position: { x: 0, y: -0.1, z: 0 },
      index: 0,
    });
    return obj;
  }
}
