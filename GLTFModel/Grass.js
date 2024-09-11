import GLTF from "./GLTF.js";
import InstanceMesh from "./InstanceMesh.js";

export default class Grass extends InstanceMesh {
  static base = { x: 1, z: 1 };
  static offset = { x: 0, y: 0 };

  constructor({ maxInstance }) {
    super();
    this.maxInstance = maxInstance;
    this.name = "Grass";
    this.scale = { x: 1 / 30, y: 1 / 30, z: 1 / 30 };
    this.modelUrl = "../models/grass/tile-plain_grass.glb";
  }

  static async create({ maxInstance = 10 }) {
    const obj = await GLTF.create({
      obj: new Grass({ maxInstance }),
      position: {
        x: 0,
        y: 0,
        z: 0,
      },
    });
    obj.createInstanceMesh();
    return obj;
  }
}
