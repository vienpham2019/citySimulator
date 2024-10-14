import * as THREE from "three";
import {
  calculateDistanceAndAngle,
  calculateHypotenuse,
  calculateSpeedComponents,
} from "../helper/point.js";
import GLTF from "./GLTF.js";
import InstanceMesh from "./InstanceMesh.js";
import { degreesToRadians } from "../helper/index.js";
import {
  getRectVertices,
  rotatePointAroundCenter,
  verticalVertices,
} from "../helper/vertice.js";
import {
  getLineIntersection,
  isRectColliding,
} from "../helper/intersection.js";
import Geometry from "../Geometry.js";
const colors = {
  Green: 0x00ff00,
  Yellow: 0xffff00,
  Red: 0xff0000,
};
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
    this.step = 10;
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

  getInstanceHitBoxAndRay = ({ angleRadians, position: { x, y } }) => {
    // const instance = this.usedInstanceIndex[index];
    // if (!instance) return;
    // const {
    //   angleRadians,
    //   position: { x, y },
    // } = instance;

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

  getHitbox({ x, y, angleRadians }) {
    const body = {
      x,
      y,
      width: Vehicle.hitBox.width,
      height: Vehicle.hitBox.length,
      angle: angleRadians,
    };
    const { x: headX, y: headY } = rotatePointAroundCenter({
      x,
      y: y + Vehicle.hitBox.length / 2,
      centerX: x,
      centerY: y,
      angleRadians: -angleRadians,
    });
    const head = {
      x: headX,
      y: headY,
      width: Vehicle.hitBox.width / 2,
      height: Vehicle.hitBox.length / 4,
      angle: angleRadians,
    };
    return { head, body };
  }

  getIsAvaliable() {
    return this.avalableIndex.length > 0;
  }

  init({ paths = [] }) {
    this.createInstanceMesh();

    paths.forEach((path) => this.addPath(path));
  }

  addPath(path) {
    const uniquePath = [...new Set(path)];
    if (!this.getIsAvaliable() || uniquePath.length < 2) return;
    const index = this.avalableIndex.shift();
    const paths = [];
    for (let i = 0; i < uniquePath.length - 1; i++) {
      const [x1, y1] = uniquePath[i].split(",");
      const [x2, y2] = uniquePath[i + 1].split(",");
      const currentPosition = { x: +x1, y: +y1 };
      const targetPosition = { x: +x2, y: +y2 };
      const { length, angleDeg } = calculateDistanceAndAngle({
        position1: currentPosition,
        position2: targetPosition,
      });

      const rotateAngle = parseFloat((-angleDeg + 90) % 360).toFixed(2);
      const degToRad = parseFloat(
        THREE.MathUtils.degToRad(rotateAngle)
      ).toFixed(2);
      paths.push({
        position: currentPosition,
        angleRadians: degToRad,
        distanceToNextNode: length,
        speedOffset: calculateSpeedComponents(
          currentPosition,
          targetPosition,
          this.maxSpeed
        ),
      });
    }
    this.usedInstanceIndex[index] = {
      speed: this.maxSpeed,
      paths,
      color: colors.Green,
    };
    // this.usedInstanceIndex[index] = { path: uniquePath, speed: this.maxSpeed };
    // this.updateUsedInstanceIndex({ index });
    const { angleRadians, position } = this.usedInstanceIndex[index].paths[0];
    // this.updateInstanceMeshPosition({
    //   position: {
    //     x: position.x,
    //     y: 0,
    //     z: position.y,
    //   },
    //   angleRadians,
    //   index,
    // });
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

  getHitBoxAndRaysVertices({ position, angleRadians }) {
    const { hitBox, rays } = this.getInstanceHitBoxAndRay({
      position,
      angleRadians,
    });
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

  checkCollision({ index, position: { newX, newY }, angleRadians }) {
    // const {
    //   position: { x: currentX, y: currentY },
    // } = this.usedInstanceIndex[index];
    const { body: head1 } = this.getHitbox({
      x: newX,
      y: newY,
      angleRadians,
    });
    for (let targetIndex in this.usedInstanceIndex) {
      if (targetIndex === index) break;
      // this.usedInstanceIndex[targetIndex].color = colors.Yellow;
      const {
        position: { x: targetX, y: targetY },
        angleRadians: targetAngle,
      } = this.usedInstanceIndex[targetIndex].paths[0];

      const { body: body2 } = this.getHitbox({
        x: targetX,
        y: targetY,
        angleRadians: targetAngle,
      });

      if (isRectColliding(head1, body2)) {
        return true;
      }

      // const { hitBox: hitBoxVertices1, rays: raysVertices1 } =
      //   this.getHitBoxAndRaysVertices({
      //     position: { x: newX, y: newY },
      //     angleRadians,
      //   });
      // const { hitBox: hitBoxVertices2, rays: raysVertices2 } =
      //   this.getHitBoxAndRaysVertices({
      //     position: { x: targetX, y: targetY },
      //     angleRadians: targetAngle,
      //   });

      // if (
      //   this.checkRectangleCollision(raysVertices1, hitBoxVertices2) ||
      //   this.checkRectangleCollision(raysVertices2, hitBoxVertices1)
      // )
      //   return true;
    }
    return false;
  }

  checkTrafficLightCollision({
    trafficLight,
    position: { newX, newY },
    angleRadians,
  }) {
    const trafficLightHitBoxs = trafficLight.getRedLightsHitBox({
      position: { x: Math.round(newX), y: Math.round(newY) },
    });

    if (!trafficLightHitBoxs) return false;
    const { rays: raysVertices1 } = this.getHitBoxAndRaysVertices({
      position: { x: newX, y: newY },
      angleRadians,
    });
    const collition = this.checkRectangleCollision(
      raysVertices1,
      trafficLightHitBoxs
    );
    if (collition) return true;

    return false;
  }

  move() {
    if (this.avaliable === this.maxInstance) return;
    Object.entries(this.usedInstanceIndex).forEach(([index, { paths }]) => {
      if (paths.length <= 1) {
        // move last instance of array out of sence
        this.updateInstanceMeshPosition({
          position: {
            x: 0,
            y: 1e10,
            z: 0,
          },
          angleRadians: 0,
          index,
        });
        this.avalableIndex.push(index);
        delete this.usedInstanceIndex[index];
      } else {
        let { position, angleRadians, distanceToNextNode, speedOffset } =
          paths[0];
        if (
          this.checkCollision({
            index,
            position: { newX: position.x, newY: position.y },
            angleRadians,
          })
        ) {
          return;
        }

        const distanceDiff = calculateHypotenuse(
          speedOffset.speedX,
          speedOffset.speedY
        );
        const newDistanceToNextNode = distanceToNextNode - distanceDiff;

        let newX = position.x + speedOffset.speedX;
        let newY = position.y + speedOffset.speedY;

        if (newDistanceToNextNode <= 0) {
          const path = this.usedInstanceIndex[index].paths.shift();
          const { angleRadians: newAngleRadians, position: newPosition } =
            this.usedInstanceIndex[index].paths[0];
          angleRadians = newAngleRadians;

          newX = newPosition.x;
          newY = newPosition.y;
          if (
            this.checkCollision({
              index,
              position: { newX, newY },
              angleRadians,
            })
          ) {
            this.usedInstanceIndex[index].paths.unshift(path);
            return;
          }
        } else {
          if (
            this.checkCollision({
              index,
              position: { newX, newY },
              angleRadians,
            })
          ) {
            return;
          }

          this.usedInstanceIndex[index].paths[0].distanceToNextNode =
            newDistanceToNextNode;
          this.usedInstanceIndex[index].paths[0].position = {
            x: newX,
            y: newY,
          };
        }
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
    });
  }

  oldMove(trafficLight) {
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
          if (
            trafficLight &&
            this.checkTrafficLightCollision(trafficLight, index)
          ) {
            return;
          }
          if (this.checkCollision({ index })) return;

          const distanceDiff = calculateHypotenuse(
            speedOffset.speedX,
            speedOffset.speedY
          );
          const newDistanceToNextNode = distanceToNextNode - distanceDiff;

          const newX = position.x + speedOffset.speedX;
          const newY = position.y + speedOffset.speedY;

          if (newDistanceToNextNode <= 0) {
            this.updateUsedInstanceIndex({ index });
          } else {
            this.usedInstanceIndex[index].distanceToNextNode =
              newDistanceToNextNode;
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
