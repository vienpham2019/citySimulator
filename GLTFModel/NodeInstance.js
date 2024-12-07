import InstanceMesh from "./InstanceMesh.js";
import * as THREE from "three";
const color = new THREE.Color();
export default class NodeInstance extends InstanceMesh {
  constructor({ maxInstance }) {
    super();
    this.maxInstance = maxInstance;
    this.scale = { x: 1, y: 1, z: 1 };
    this.usedIndexs = 0;
  }

  addInstanceToSence({ position, angleRadians = 0, strColor = "White" }) {
    if (this.usedIndexs >= this.maxInstance) return;
    const index = this.usedIndexs++;
    const colorToHex = {
      White: 0xffffff,
      Green: 0x00ff00,
      Red: 0xff0000,
    };

    for (const instanceMesh of this.instanceMesh.children) {
      instanceMesh.setColorAt(index, color.setHex(colorToHex[strColor]));
      instanceMesh.instanceColor.needsUpdate = true;
      break;
    }
    // this.hightlightInstanceMeshObj({ index, color: 0xff0000 });
    this.updateInstanceMeshPosition({ position, index, angleRadians });
  }

  resetInstance() {
    let countUsedIndex = this.usedIndexs;
    for (let i = 0; i < countUsedIndex; i++) {
      this.removeInstanceFromSence();
    }
  }

  removeInstanceFromSence() {
    if (this.usedIndexs <= 0) return;
    this.updateInstanceMeshPosition({
      position: { x: 1e10, y: 1e10, z: 1e10 },
      index: this.usedIndexs--,
    });
  }

  updateInstanceMeshPosition({ position, index, angleRadians = 0 }) {
    if (position.z === null || position.z === undefined) {
      position = {
        x: position.x,
        y: 0,
        z: position.y,
      };
    }
    super.updateInstanceMeshPosition({
      position,
      index,
      angleRadians,
    });
  }
}
