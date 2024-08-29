import Building from "./Building.js";

export default class Vehicle extends Building {
  static base = { x: 1, z: 1 };
  static offset = { x: 0, y: 0 };

  constructor({ modelUrl, scale }) {
    super({
      modelUrl,
      scale,
    });
  }

  static async create({
    position = { x: 0, y: 0 },
    scale = { x: 1, y: 1, z: 1 },
    speed = 0.01,
    name = "Vehicle",
    modelUrl = "../models/vehicles/car-taxi.glb",
  }) {
    position = {
      x: position.x + Vehicle.offset.x,
      y: 0,
      z: position.y + Vehicle.offset.y,
    };
    const obj = await super.create({
      obj: new Vehicle({ modelUrl, scale }),
      position,
    });
    obj.position = position;
    obj.speed = speed;
    obj.mesh.name = name;

    return obj;
  }

  move() {
    this.mesh.position.set(this.position.x, 0, (this.position.z += this.speed));
  }
}
