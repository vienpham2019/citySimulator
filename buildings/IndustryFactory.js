import Building from "./Building.js";

export default class IndustryFactory extends Building {
  static base = { x: 2, z: 2 };
  static modelUrl = "../models/industry-factory-old.glb";
  static offset = { x: 0.5, y: 0.5 };

  constructor({ isPreview }) {
    super({
      isPreview,
      modelUrl: IndustryFactory.modelUrl,
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
