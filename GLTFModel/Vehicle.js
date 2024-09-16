import * as THREE from "three";
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
  static scale = { x: 1 / 30, y: 1 / 30, z: 1 / 30 };
  static hitBox = {
    offset: { x: 0, y: 0 },
    length: 5.5 * Vehicle.scale.y,
    width: 2 * Vehicle.scale.x,
  };
  static collisionBox = {
    offset: { x: 0, y: 0.1 },
    length: 0.5 * Vehicle.scale.y,
    width: 2 * Vehicle.scale.x,
  };

  constructor({ speed, maxInstance }) {
    super();
    this.maxInstance = maxInstance;
    this.usedInstanceIndex = [];
    this.maxSpeed = speed;
    this.speed = speed;
    this.scale = Vehicle.scale;
    this.modelUrl = "../models/vehicles/car-taxi.glb";
    this.position = { x: 0, y: 0 };
  }

  static async create({ speed = 0.016, paths = [], maxInstance }) {
    const obj = await GLTF.create({
      obj: new Vehicle({
        speed,
        maxInstance,
      }),
      position: {
        x: 0,
        y: 0,
        z: 0,
      },
    });
    obj.init({ paths });
    return obj;
  }

  getIsAvaliable() {
    return this.maxInstance !== this.usedInstanceIndex.length;
  }

  init({ paths = [] }) {
    this.createInstanceMesh();

    paths.forEach((path) => this.addPath(path));
  }

  addPath(path) {
    if (!this.getIsAvaliable() || path.length < 2) return;
    const index = this.usedInstanceIndex.length;
    this.usedInstanceIndex.push({ path, speed: this.maxSpeed });
    this.updateUsedInstanceIndex({ index });
    const { angleRadians, position } = this.usedInstanceIndex[index];
    this.updateInstanceMeshPosition({
      position: {
        x: position.x,
        y: 0,
        z: position.y,
      },
      angleRadians,
      index,
    });
  }

  updateUsedInstanceIndex({ index }) {
    const { path, speed } = this.usedInstanceIndex[index];
    const [x1, y1] = path[0].split(",");
    const [x2, y2] = path[1].split(",");
    const currentPosition = { x: +x1, y: +y1 };
    const targetPosition = { x: +x2, y: +y2 };
    const { length, angleDeg } = calculateDistanceAndAngle({
      position1: currentPosition,
      position2: targetPosition,
    });
    const rotateAngle = parseFloat((-angleDeg + 90) % 360).toFixed(2);
    const degToRad = parseFloat(THREE.MathUtils.degToRad(rotateAngle)).toFixed(
      2
    );
    path.shift();
    this.usedInstanceIndex[index] = {
      path,
      position: currentPosition,
      angleRadians: degToRad,
      distanceToNextNode: length,
      speed,
      speedOffset: calculateSpeedComponents(
        currentPosition,
        targetPosition,
        speed
      ),
    };
  }

  move() {
    if (this.avaliable === this.maxInstance) return;

    this.usedInstanceIndex.forEach(
      (
        { path, position, angleRadians, distanceToNextNode, speedOffset },
        index
      ) => {
        if (path.length <= 1) {
          // move last instance of array out of sence
          this.updateInstanceMeshPosition({
            position: {
              x: 0,
              y: 1e10,
              z: 0,
            },
            angleRadians,
            index: this.usedInstanceIndex.length - 1,
          });
          this.usedInstanceIndex.splice(index, 1);
        } else {
          const distanceDiff = calculateHypotenuse(
            speedOffset.speedX,
            speedOffset.speedY
          );
          const newDistanceToNextNode = distanceToNextNode - distanceDiff;

          if (newDistanceToNextNode <= 0) {
            this.updateUsedInstanceIndex({ index });
          } else {
            this.usedInstanceIndex[index].distanceToNextNode =
              newDistanceToNextNode;
            const newX = position.x + speedOffset.speedX;
            const newY = position.y + speedOffset.speedY;

            this.usedInstanceIndex[index].position = { x: newX, y: newY };
            this.updateInstanceMeshPosition({
              position: {
                x: newX,
                y: 0,
                z: newY,
              },
              angleRadians,
              index,
            });
          }
        }
      }
    );
  }
}
