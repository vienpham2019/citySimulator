import GLTF from "./GLTF.js";

export default class IndustryFactory extends GLTF {
  static base = { x: 2, z: 2 };
  static modelUrl = "../models/buildings/industry-factory-old.glb";
  static offset = { x: 0.5, y: 0.5 };

  constructor({ isPreview }) {
    super({
      isPreview,
      modelUrl: IndustryFactory.modelUrl,
      scale: { x: 2, y: 2, z: 2 },
    });
  }

  static async create({
    position = { x: 0, y: 0 },
    rotation = { x: 0, y: 0, z: 0 },
    isPreview = false,
  }) {
    const obj = await super.create({
      obj: new IndustryFactory({ isPreview }),
      position,
    });
    obj.rotate(rotation);
    return obj;
  }

  updatePosition({ x, z }) {
    this.mesh.position.set(
      x + IndustryFactory.offset.x,
      0,
      z + IndustryFactory.offset.y
    );
  }
}
