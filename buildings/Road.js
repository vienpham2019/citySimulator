import Building from "./Building.js";

export default class Road extends Building {
  static base = { x: 1, z: 1 };
  static offset = { x: 0, y: 0 };

  constructor({ isPreview, modelUrl }) {
    super({
      isPreview,
      modelUrl,
    });
  }

  static async create({
    position = { x: 0, y: 0 },
    isPreview = false,
    name = "Road",
    modelUrl = "../models/roads/tile-mainroad-straight.glb",
  }) {
    position = {
      x: position.x + Road.offset.x,
      y: 0.2,
      z: position.z + Road.offset.y,
    };
    const obj = await super.create({
      obj: new Road({ isPreview, modelUrl }),
      position,
    });
    obj.position = position;
    obj.mesh.name = isPreview ? "Preview Road" : name;
    return obj;
  }

  updatePosition({ x, z }) {
    this.mesh.position.set(x + Road.offset.x, -0.2, z + Road.offset.y);
  }
}
