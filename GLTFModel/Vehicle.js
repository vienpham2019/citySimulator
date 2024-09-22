import * as THREE from "three";
import {
  calculateDistanceAndAngle,
  calculateHypotenuse,
  calculateSpeedComponents,
} from "../helper/point.js";
import GLTF from "./GLTF.js";
import InstanceMesh from "./InstanceMesh.js";
import { degreesToRadians } from "../helper/index.js";
import { getRectVertices, verticalVertices } from "../helper/vertice.js";
import { getLineIntersection } from "../helper/intersection.js";

export default class Vehicle extends InstanceMesh {
  static scale = { x: 1 / 30, y: 1 / 30, z: 1 / 30 };
  static hitBox = {
    width: 2 * Vehicle.scale.x,
    length: 5.5 * Vehicle.scale.y,
    rotation: Math.PI,
  };

  static offset = { x: 0, y: 0 };

  constructor({ speed, maxInstance }) {
    super();
    this.maxInstance = maxInstance;
    this.avalableIndex = Array.from({ length: maxInstance }, (_, i) => i);
    this.usedInstanceIndex = {};
    this.maxSpeed = speed;
    this.speed = speed;
    this.scale = Vehicle.scale;
    this.modelUrl = "../models/vehicles/car-taxi.glb";
    this.position = { x: 0, y: 0 };
  }

  static async create({ speed = 0.01, paths = [], maxInstance }) {
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

  getInstanceHitBoxAndRay = ({ index }) => {
    const instance = this.usedInstanceIndex[index];
    if (!instance) return;
    const {
      angleRadians,
      position: { x, y },
    } = instance;

    return {
      hitBox: {
        ...Vehicle.hitBox,
        x,
        y,
        rotation: -angleRadians,
      },
      rays: [
        {
          x,
          y,
          length: 5 * Vehicle.scale.y,
          rotation: -angleRadians + degreesToRadians(90),
        },
        {
          x,
          y,
          length: 4 * Vehicle.scale.y,
          rotation: -angleRadians + degreesToRadians(70),
        },
        {
          x,
          y,
          length: 4 * Vehicle.scale.y,
          rotation: -angleRadians + degreesToRadians(110),
        },
      ],
    };
  };

  getIsAvaliable() {
    return this.avalableIndex.length > 0;
  }

  init({ paths = [] }) {
    this.createInstanceMesh();

    paths.forEach((path) => this.addPath(path));
  }

  addPath(path) {
    if (!this.getIsAvaliable() || path.length < 2) return;
    const index = this.avalableIndex.shift();
    this.usedInstanceIndex[index] = { path, speed: this.maxSpeed };
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

  getHitBoxAndRaysVertices({ index }) {
    const { hitBox, rays } = this.getInstanceHitBoxAndRay({ index });
    const { TopRight, TopLeft, BottomLeft, BottomRight } =
      getRectVertices(hitBox);
    return {
      hitBox: [
        [TopRight, TopLeft],
        [TopRight, BottomRight],
        [BottomLeft, BottomRight],
        [TopLeft, BottomLeft],
      ],
      rays: rays.map((r) => verticalVertices(r)),
    };
  }
  checkRectangleCollision(rect1Edges, rect2Edges) {
    for (let line1 of rect1Edges) {
      for (let line2 of rect2Edges) {
        const intersect = getLineIntersection(line1, line2);
        if (intersect) {
          return true; // Collision detected
        }
      }
    }
    return false; // No collision detected
  }

  checkCollision({ index }) {
    const {
      position: { x: currentX, y: currentY },
    } = this.usedInstanceIndex[index];
    for (let targetIndex in this.usedInstanceIndex) {
      if (targetIndex === index) break;
      const {
        position: { x: targetX, y: targetY },
      } = this.usedInstanceIndex[index];
      if (
        Math.round(currentX) !== Math.round(targetX) &&
        Math.round(currentY) !== Math.round(targetY)
      ) {
        break;
      }

      const { rays: raysVertices1 } = this.getHitBoxAndRaysVertices({
        index: index,
      });
      const { hitBox: hitBoxVertices2 } = this.getHitBoxAndRaysVertices({
        index: targetIndex,
      });
      const collition = this.checkRectangleCollision(
        raysVertices1,
        hitBoxVertices2
      );
      if (collition) return true;
    }
    return false;
  }

  move() {
    if (this.avaliable === this.maxInstance) return;
    Object.entries(this.usedInstanceIndex).forEach(
      ([
        index,
        { path, position, angleRadians, distanceToNextNode, speedOffset },
      ]) => {
        if (path.length <= 1) {
          // move last instance of array out of sence
          this.updateInstanceMeshPosition({
            position: {
              x: 0,
              y: 1e10,
              z: 0,
            },
            angleRadians,
            index,
          });
          this.avalableIndex.push(index);
          delete this.usedInstanceIndex[index];
        } else {
          if (this.checkCollision({ index })) return;
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
