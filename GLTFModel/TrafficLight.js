import Geometry from "../Geometry.js";
import { verticalVertices } from "../helper/vertice.js";
import GLTF from "./GLTF.js";
import InstanceMesh from "./InstanceMesh.js";

export default class TrafficLight extends InstanceMesh {
  static scale = { x: 1 / 30, y: 1 / 30, z: 1 / 30 };
  static lightVal = {
    red: {
      time: 600,
      index: [1, 4],
    },
    redDelay: {
      time: 150,
      index: [1, 4],
    },
    yellow: {
      time: 100,
      index: [2, 5],
    },
    yellowDelay: {
      time: 50,
      index: [1, 4],
    },
    green: {
      time: 500,
      index: [3, 6],
    },
  };
  constructor({ maxInstance }) {
    super();
    this.maxInstance = maxInstance;
    this.avalableIndex = Array.from({ length: maxInstance }, (_, i) => i);
    this.usedInstanceIndex = {};
    this.scale = TrafficLight.scale;
    this.modelUrl = "../models/traffic-lights.glb";
    this.lights = {};
  }

  static async create({ maxInstance }) {
    const obj = await GLTF.create({
      obj: new TrafficLight({
        maxInstance,
      }),
    });
    obj.init();
    return obj;
  }

  init() {
    this.createInstanceMesh();
    const lightsOffset = {
      top: [
        { x: -1.76, y: 8.85, z: 0.251, color: 0xff0000 },
        { x: -1.76, y: 8.5, z: 0.251, color: 0xffff00 },
        { x: -1.76, y: 8.16, z: 0.251, color: 0x00ff00 },
      ],
      bottom: [
        { x: 0, y: 3.85, z: 0.251, color: 0xff0000 },
        { x: 0, y: 3.5, z: 0.251, color: 0xffff00 },
        { x: 0, y: 3.16, z: 0.251, color: 0x00ff00 },
      ],
    };
    const sides = 8;
    const radius = 0.13;

    for (let key in lightsOffset) {
      lightsOffset[key].forEach(({ x, y, z, color }) => {
        const light = Geometry.nGon({
          sides,
          radius,
          color,
        });

        this.instanceMesh.add(
          this.initInstanceMesh({
            mesh: light,
            offset: {
              x: x * TrafficLight.scale.x,
              y: y * TrafficLight.scale.y,
              z: z * TrafficLight.scale.z,
            },
          })
        );
      });
    }
    this.light = {
      time: 1,
      type: "yellow",
    };
  }

  getRedLightsHitBox({ position }) {
    const foundLightIntersect = this.lights[`${position.x},0,${position.y}`];
    if (!foundLightIntersect) return;
    const res = [];
    foundLightIntersect.forEach((l) => {
      if (l.type !== "green") res.push(l.hitBox);
    });
    return res;
  }

  createIntersectLight({ position, intersectCount, intersectAngle = 0 }) {
    if (this.avalableIndex.length <= intersectCount || intersectCount < 3) {
      return;
    }
    this.deleteIntersectLight({ position });
    const offset = {
      top: { x: 0.25, z: -0.34, angle: 0 },
      right: { x: 0.34, z: 0.25, angle: -Math.PI / 2 },
      bottom: { x: -0.25, z: 0.34, angle: Math.PI },
      left: { x: -0.34, z: -0.25, angle: Math.PI / 2 },
    };
    const intersectDirection = ["top", "right", "bottom", "left"];
    if (intersectCount === 3) {
      if (intersectAngle === 0) intersectDirection.splice(2, 1);
      else if (intersectAngle === 90) intersectDirection.splice(1, 1);
      else if (intersectAngle === 180) intersectDirection.splice(0, 1);
      else if (intersectAngle === 270) intersectDirection.splice(3, 1);
    }
    const lights = [];
    intersectDirection.forEach((d) => {
      const { x, z, angle } = offset[d];
      const lightPosition = {
        x: position.x + x,
        y: position.y,
        z: position.z + z,
      };
      const lightIndex = this.avalableIndex.shift();
      let light = {
        time: 1,
        position: lightPosition,
        lightIndex,
        angle,
      };
      if (d === "top") {
        light.type = "red";
        light.hitBox = verticalVertices({
          x: position.x + 0.05,
          y: position.z + 0.35,
          rotation: 0,
          length: 0.15,
        });
      } else if (d === "right") {
        light.type = "green";
        light.hitBox = verticalVertices({
          x: position.x - 0.35,
          y: position.z + 0.05,
          rotation: Math.PI / 2,
          length: 0.15,
        });
      } else if (d === "bottom") {
        light.type = "red";
        light.hitBox = verticalVertices({
          x: position.x - 0.2,
          y: position.z - 0.35,
          rotation: 0,
          length: 0.15,
        });
      } else if (d === "left") {
        light.type = "green";
        light.hitBox = verticalVertices({
          x: position.x + 0.35,
          y: position.z - 0.21,
          rotation: Math.PI / 2,
          length: 0.15,
        });
      }
      lights.push(light);
      this.updateInstanceMeshPosition({
        position: lightPosition,
        index: lightIndex,
        angleRadians: angle,
      });
    });
    this.lights[`${position.x},0,${position.z}`] = lights;
  }

  deleteIntersectLight({ position }) {
    const foundLightIntersect =
      this.lights[`${position.x},${position.y},${position.z}`];
    if (!foundLightIntersect) return;
    foundLightIntersect.lights.forEach(({ lightIndex }) => {
      this.updateInstanceMeshPosition({
        position: { x: 0, y: 1e10, z: 0 },
        index: lightIndex,
      });
      this.avalableIndex.push(lightIndex);
    });
    delete this.lights[`${position.x},${position.y},${position.z}`];
  }

  updateLight({ lightIndex, type, position, angle = 0 } = {}) {
    let subIndex = [];
    const turnOnLightIndex = TrafficLight.lightVal[type].index;
    let turnOffLightIndex = [1, 2, 3, 4, 5, 6];
    turnOffLightIndex.filter((i) => !turnOnLightIndex.includes(i));

    subIndex.push([turnOffLightIndex, { x: 0, y: 1e10, z: 0 }]);
    subIndex.push([turnOnLightIndex, position]);
    this.updateInstanceMeshPosition({
      index: lightIndex,
      isAll: false,
      subIndex,
      angleRadians: angle,
    });
  }

  update() {
    Object.entries(this.lights).forEach(([key, lights]) => {
      lights.forEach(({ type, position, lightIndex, angle }, i) => {
        if (this.lights[key][i].time-- <= 0) {
          const currentLightType = type;
          const nextLightMap = {
            green: "yellow",
            red: "redDelay",
            redDelay: "green",
            yellow: "yellowDelay",
            yellowDelay: "red",
          };
          const nextLightType = nextLightMap[currentLightType];
          this.lights[key][i].type = nextLightType;
          this.lights[key][i].time = TrafficLight.lightVal[nextLightType].time;
          this.updateLight({
            lightIndex,
            type: nextLightType,
            position,
            angle,
          });
        }
      });
    });
  }
}
