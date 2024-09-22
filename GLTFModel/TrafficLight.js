import Geometry from "../Geometry.js";
import GLTF from "./GLTF.js";
import InstanceMesh from "./InstanceMesh.js";

export default class TrafficLight extends InstanceMesh {
  static scale = { x: 1 / 30, y: 1 / 30, z: 1 / 30 };
  static lightVal = {
    red: {
      time: 500,
      index: [1, 4],
    },
    yellow: {
      time: 200,
      index: [2, 5],
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
    this.position = { x: 0, y: 0, z: 0 };

    this.light = {
      time: 0,
      type: "red",
    };
  }

  static async create({ maxInstance }) {
    const obj = await GLTF.create({
      obj: new TrafficLight({
        maxInstance,
      }),
      position: {
        x: 0,
        y: 0,
        z: 0,
      },
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
    this.updateInstanceMeshPosition({
      position: { x: 0, y: 0, z: 0 },
      index: 0,
    });

    this.updateLight("red");
  }
  updateLight({ prevLightType = null } = {}) {
    if (prevLightType !== null) {
      this.updateInstanceMeshPosition({
        position: { x: 0, y: 1e10, z: 0 },
        index: 0,
      });
      this.instanceMesh.children[0].material.opacity = 0.5;
    }
    const turnOnLightIndex = TrafficLight.lightVal[this.light.type].index;
    this.updateInstanceMeshPosition({
      position: this.position,
      index: 0,
      isAll: false,
      subIndex: [0, ...turnOnLightIndex],
    });
  }

  update() {
    if (this.light.time-- <= 0) {
      const currentLightType = this.light.type;
      const nextLightMap = {
        green: "yellow",
        red: "green",
        yellow: "red",
      };
      const nextLightType = nextLightMap[currentLightType];
      this.light = {
        type: nextLightType,
        time: TrafficLight.lightVal[nextLightType].time,
      };
      this.updateLight({ prevLightType: currentLightType });
    }
  }
}
