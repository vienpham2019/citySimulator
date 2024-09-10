import {
  calculateDistanceAndAngle,
  calculateHypotenuse,
  calculateSpeedComponents,
} from "../helper/point.js";
import Building from "./Building.js";

export default class Vehicle extends Building {
  static base = { x: 1, z: 1 };
  static offset = { x: 0, y: 0 };

  constructor({ modelUrl, scale, path, speed }) {
    super({
      modelUrl,
      scale,
    });
    this.path = path;
    this.speed = speed;
    this.isArrived = false;
    this.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  static async create({
    scale = { x: 1, y: 1, z: 1 },
    speed = 0.006,
    modelUrl = "../models/vehicles/car-taxi.glb",
    path = [],
  }) {
    if (path.length === 0) return null;
    let [x, y] = path[0].split(",");
    let position = {
      x: +x + Vehicle.offset.x,
      y: 0,
      z: +y + Vehicle.offset.y,
    };
    const obj = await super.create({
      obj: new Vehicle({ modelUrl, scale, path, speed }),
      position,
    });
    obj.mesh.name = obj.id;
    obj.initVehicleSpeed();

    return obj;
  }

  initVehicleSpeed() {
    const [x1, y1] = this.path[0].split(",");
    const [x2, y2] = this.path[1].split(",");
    const { length, angle } = calculateDistanceAndAngle({
      position1: { x: +x1, y: +y1 },
      position2: { x: +x2, y: +y2 },
    });

    const rotateAngle = parseFloat((-angle + 90) % 360).toFixed(2);
    this.setRotate({ y: rotateAngle });

    this.distanceToNextNode = length;
    this.speedOffset = calculateSpeedComponents(
      this.mesh.position,
      { x: +x2, y: +y2 },
      this.speed
    );
    this.path.shift();
  }

  resetPosition(path) {
    this.path = path;
    let [x, y] = path[0].split(",");
    this.mesh.position.set(+x + Vehicle.offset.x, 0, +y + Vehicle.offset.y);
    this.initVehicleSpeed();
    setTimeout(() => {
      this.isArrived = false;
      this.mesh.visible = true;
    }, 1000);
  }

  move() {
    if (this.path.length <= 1) {
      this.isArrived = true;
      this.mesh.visible = false;
      return;
    }
    this.distanceToNextNode -= calculateHypotenuse(
      this.speedOffset.speedX,
      this.speedOffset.speedY
    );
    if (this.distanceToNextNode <= 0) {
      this.initVehicleSpeed();
    } else {
      this.mesh.position.set(
        (this.mesh.position.x += this.speedOffset.speedX),
        0,
        (this.mesh.position.z += this.speedOffset.speedY)
      );
    }
  }
}
