import * as THREE from "three";
import { rotateVector } from "../helper/point.js";
const color = new THREE.Color();

export default class InstanceMesh {
  constructor() {
    this.instanceMesh = new THREE.Group();
  }
  createInstanceMesh() {
    this.mesh.traverse((child) => {
      if (child.isMesh) {
        // console.log(child);
        this.instanceMesh.add(this.initInstanceMesh({ mesh: child }));
      }
    });
  }

  initInstanceMesh({ mesh, offset = { x: 0, y: 0, z: 0 } }) {
    const instanceMesh = new THREE.InstancedMesh(
      mesh.geometry, // Geometry from the loaded mesh
      mesh.material, // Material from the loaded mesh
      this.maxInstance // Maximum number of instances
    );

    const matrix = new THREE.Matrix4();
    const { x: scaleX, y: scaleY, z: scaleZ } = this.scale;

    instanceMesh.userData = {
      x: mesh.position.x * scaleX + offset.x,
      y: mesh.position.y * scaleY + offset.y,
      z: mesh.position.z * scaleZ + offset.z,
    };

    const scale = new THREE.Vector3(scaleX, scaleY, scaleZ);
    matrix.compose(
      new THREE.Vector3(1e10, 1e10, 1e10), // set position offscreen
      new THREE.Quaternion(),
      scale
    );
    for (let i = 0; i < instanceMesh.count; i++) {
      instanceMesh.setMatrixAt(i, matrix);
      instanceMesh.setColorAt(i, color.setHex(0xffffff));
    }
    return instanceMesh;
  }

  updateInstanceMeshPosition({
    position,
    index,
    angleRadians = 0,
    isAll = true,
    subIndex = [],
  }) {
    if (isAll) {
      this.instanceMesh.children.forEach((instanceMesh) => {
        this.setInstanceMeshObjPosition({
          position,
          index,
          instanceMesh,
          angleRadians,
        });
      });
    } else {
      subIndex.forEach(([indexs, position]) => {
        indexs.forEach((i) => {
          const instanceMesh = this.instanceMesh.children[i];

          this.setInstanceMeshObjPosition({
            position,
            index,
            instanceMesh,
            angleRadians,
          });
        });
      });
    }
  }

  setInstanceMeshObjPosition({ position, index, instanceMesh, angleRadians }) {
    const matrix = new THREE.Matrix4();

    // Extract the existing scale from the matrix
    const rotation = new THREE.Quaternion();
    rotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angleRadians);
    // Recalculate offset
    const { x: rotateOffsetX, y: rotateOffsetY } = rotateVector({
      vector: { x: instanceMesh.userData.x, y: instanceMesh.userData.z },
      angleRadians: -angleRadians,
    });

    matrix.compose(
      new THREE.Vector3(
        position.x + rotateOffsetX,
        position.y + instanceMesh.userData.y,
        position.z + rotateOffsetY
      ),
      rotation,
      new THREE.Vector3(this.scale.x, this.scale.y, this.scale.z)
    );

    // Set the matrix at a specific index to make that instance visible
    instanceMesh.setMatrixAt(index, matrix);
    instanceMesh.instanceMatrix.needsUpdate = true;
  }

  getInstanceMeshPosition({ index }) {
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    for (let instanceMesh of this.instanceMesh.children) {
      console.log(instanceMesh);
      instanceMesh.getMatrixAt(index, matrix);
      matrix.decompose(position, quaternion, scale);

      return position;
    }
  }

  hightlightInstanceMeshObj({ index, color = 0xff0000 }) {
    this.instanceMesh.children.forEach((instanceMesh) => {
      instanceMesh.instanceMatrix.needsUpdate = true;
      const colorVector = new THREE.Color(color);
      instanceMesh.setColorAt(index, colorVector);
    });
  }
}
