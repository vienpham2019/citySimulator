import {
  calculateDistanceAndAngle,
  calculateHypotenuse,
  calculateSpeedComponents,
} from "../helper/point.js";
import GLTF from "./GLTF.js";
import InstanceMesh from "./InstanceMesh.js";

export default class Vehicle extends InstanceMesh {
  static base = { x: 1, z: 1 };
  static offset = { x: 0, y: 0 };

  constructor({ paths, speed, maxInstance }) {
    super();
    this.maxInstance = maxInstance;
    this.paths = paths;
    this.speed = speed;
    this.isArrived = false;
    this.scale = { x: 1 / 30, y: 1 / 30, z: 1 / 30 };
    this.modelUrl = "../models/vehicles/car-taxi.glb";
  }

  static async create({ speed = 0.006, paths = [], maxInstance }) {
    const obj = await GLTF.create({
      obj: new Vehicle({ speed, paths, maxInstance }),
      position: {
        x: 0,
        y: 0,
        z: 0,
      },
    });
    obj.createInstanceMesh();
    paths.forEach((path, i) => {
      if (path.length < 2) {
        return;
      }
      const [x1, y1] = path[0].split(",");
      const [x2, y2] = path[1].split(",");
      const { length, angleDeg } = calculateDistanceAndAngle({
        position1: { x: +x1, y: +y1 },
        position2: { x: +x2, y: +y2 },
      });
      if (Math.abs(angleDeg) === 90) console.log(path);
      obj.updateInstanceMeshPosition({
        position: { x: +x1, y: +y1 },
        angleDeg,
        index: i,
      });
    });
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
