import * as THREE from "three";
import { rotateVector } from "../helper/point.js";
export default class InstanceMesh {
  constructor() {
    this.instanceMesh = new THREE.Group();
  }
  createInstanceMesh = () => {
    this.mesh.traverse((child) => {
      if (child.isMesh) {
        // console.log(child);
        const instanceMesh = new THREE.InstancedMesh(
          child.geometry, // Geometry from the loaded mesh
          child.material, // Material from the loaded mesh
          this.maxInstance // Maximum number of instances
        );
        instanceMesh.instanceMatrix.needsUpdate = false;
        const matrix = new THREE.Matrix4();
        const { x: scaleX, y: scaleY, z: scaleZ } = this.scale;

        instanceMesh.userData = {
          x: child.position.x * scaleX,
          y: child.position.y * scaleY,
          z: child.position.z * scaleZ,
        };

        const scale = new THREE.Vector3(scaleX, scaleY, scaleZ);
        matrix.compose(
          new THREE.Vector3(1e10, 1e10, 1e10), // set position offscreen
          new THREE.Quaternion(),
          scale
        );
        for (let i = 0; i < instanceMesh.count; i++) {
          instanceMesh.setMatrixAt(i, matrix);
        }

        this.instanceMesh.add(instanceMesh);
      }
    });
  };

  updateInstanceMeshPosition = ({ position, index, angleDeg = 0 }) => {
    const rotateAngle = parseFloat((-angleDeg + 90) % 360).toFixed(2);
    const degToRad = parseFloat(THREE.MathUtils.degToRad(rotateAngle)).toFixed(
      2
    );

    this.instanceMesh.children.forEach((instanceMesh) => {
      let updatePosition = {
        x: position.x,
        y: 0,
        z: position.y,
      };
      this.setInstanceMeshObjPosition({
        position: updatePosition,
        index,
        instanceMesh,
        angleRadians: degToRad,
      });
    });
  };

  setInstanceMeshObjPosition = ({
    position,
    index,
    instanceMesh,
    angleRadians,
  }) => {
    const matrix = new THREE.Matrix4();

    instanceMesh.getMatrixAt(index, matrix);

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
  };
}
