import GLTF from "./GLTF.js";
import InstanceMesh from "./InstanceMesh.js";
import * as THREE from "three";
const color = new THREE.Color();

export default class Grass extends InstanceMesh {
  static base = { x: 1, z: 1 };
  static offset = { x: 0, y: 0 };

  constructor({ maxInstance }) {
    super();
    this.maxInstance = maxInstance;
    this.name = "Grass";
    this.scale = { x: 3.34, y: 3.34, z: 3.34 };
    // this.modelUrl = "../models/grass/tile-plain_grass.glb";
    this.modelUrl = "../models/roads/tile-mainroad-intersection.glb";
    this.prevHilightIndex = null;
  }

  static async create({ maxInstance = 10 }) {
    const obj = await GLTF.create({
      obj: new Grass({ maxInstance }),
      position: {
        x: 0,
        y: 0,
        z: 0,
      },
    });
    obj.createInstanceMesh();

    return obj;
  }

  highlightByInstanceIndex({ indexs }) {
    if (!indexs.length === 0) return;

    // if (this.prevHilightIndex) {
    //   this.updateInstanceMeshPosition({
    //     index: this.prevHilightIndex.index,
    //     position: this.prevHilightIndex.position,
    //   });
    // }
    // this.updateInstanceMeshPosition({
    //   index,
    //   position: { x: 0, y: 1e10 },
    // });
    indexs.forEach((index, position) => {
      this.updateInstanceMeshPosition({
        index: this.maxInstance + 1,
        position,
      });
    });

    // this.prevHilightIndex = { index, position };
  }

  changeInstanceColor({ indexs }) {
    const red = 0xff0000;
    const gray = 0x708090;
    const white = 0xffffff;
    for (const instanceMesh of this.instanceMesh.children) {
      if (this.prevHilightIndexs?.length > 0) {
        this.prevHilightIndexs.forEach((index) => {
          instanceMesh.setColorAt(index, color.setHex(white));
        });
      }
      this.prevHilightIndexs = [];
      indexs.forEach((index) => {
        instanceMesh.setColorAt(index, color.setHex(gray));
        instanceMesh.instanceColor.needsUpdate = true;
        this.prevHilightIndexs.push(index);
      });
      break;
    }
  }

  updateInstanceMeshPosition({ position, index }) {
    super.updateInstanceMeshPosition({
      position: {
        x: position.x,
        y: 0,
        z: position.y,
      },
      index,
    });
  }
}
