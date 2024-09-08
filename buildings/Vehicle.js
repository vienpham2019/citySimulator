import {
  calculateDistanceAndAngle,
  calculateHypotenuse,
  calculateSpeedComponents,
} from "../helper/point.js";
import Building from "./Building.js";

export default class Vehicle extends Building {
  static base = { x: 1, z: 1 };
  static offset = { x: 0, y: 0 };

  constructor({ modelUrl, scale, node, speed }) {
    super({
      modelUrl,
      scale,
    });
    this.node = node;
    this.speed = speed;
    this.isArrived = false;
    this.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  static async create({
    scale = { x: 1, y: 1, z: 1 },
    speed = 0.006,
    modelUrl = "../models/vehicles/car-taxi.glb",
    node = null,
  }) {
    let position = {
      x: node.position.x + Vehicle.offset.x,
      y: 0,
      z: node.position.y + Vehicle.offset.y,
    };
    const obj = await super.create({
      obj: new Vehicle({ modelUrl, scale, node, speed }),
      position,
    });
    obj.mesh.name = obj.id;
    obj.initVehicleSpeed();

    return obj;
  }

  initVehicleSpeed() {
    const { length, angle } = calculateDistanceAndAngle({
      position1: this.node.position,
      position2: this.node.children[0].position,
    });
    this.node = this.node.children[0];
    const rotateAngle = (-angle + 90) % 360;
    this.setRotate({ y: rotateAngle.toFixed(2) });
    this.distanceToNextNode = length;
    this.speedOffset = calculateSpeedComponents(this.speed, angle);
  }

  move() {
    if (this.distanceToNextNode <= 0) {
      if (this.node.isEndNode()) {
        this.isArrived = true;
        return;
      }
      this.initVehicleSpeed();
    }

    this.distanceToNextNode -= calculateHypotenuse(
      this.speedOffset.speedX,
      this.speedOffset.speedY
    );
    this.mesh.position.set(
      (this.mesh.position.x += this.speedOffset.speedX),
      0,
      (this.mesh.position.z += this.speedOffset.speedY)
    );
  }
}
