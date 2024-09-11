import * as THREE from "three";
import Geometry from "../Geometry.js";
import Grass from "../GLTFModel/Grass.js";
import Vehicle from "../GLTFModel/Vehicle.js";

const createInstanceMesh = ({ maxCount = 100, mesh = null, obj = null }) => {
  let matrix;
  // Create the InstancedMesh with a capacity of maxCount instances
  const instanceMesh = new THREE.InstancedMesh(
    mesh.geometry,
    mesh.material,
    maxCount // Maximum number of instances
  );
  if (!obj) {
    // Ensure no instances are visible initially
    matrix = new THREE.Matrix4();
    matrix.setPosition(new THREE.Vector3(1e10, 1e10, 1e10)); // Move out of view
  } else {
    matrix = obj.matrix;
  }

  // Initialize all instances to be out of view or with zero scale
  for (let i = 0; i < instanceMesh.count; i++) {
    instanceMesh.setMatrixAt(i, matrix);
  }

  return { instanceMesh, index: 0 };
};

const createPointInstanceMesh = ({ maxCount = 100, color = 0xffffff }) => {
  const mesh = Geometry.point({
    position: { x: 0, y: 0, z: 0 },
    color,
  });
  return createInstanceMesh({ maxCount, mesh });
};

const setPointPosition = ({ position, index, instanceMesh }) => {
  setInstanceMeshObjPosition({ position, index, instanceMesh });
};

const setInstanceMeshObjPosition = ({ position, index, instanceMesh }) => {
  const matrix = new THREE.Matrix4();
  // Example position for an instance
  instanceMesh.getMatrixAt(index, matrix);
  if (!position.z) {
    position = {
      x: position.x,
      y: 0,
      z: position.y,
    };
  }

  matrix.setPosition(new THREE.Vector3(position.x, position.y, position.z));
  // Set the matrix at a specific index to make that instance visible
  instanceMesh.setMatrixAt(index, matrix);
};

const createArrowInstanceMesh = ({ maxCount = 100, color = 0xffffff }) => {
  const mesh = Geometry.cone({
    position: { x: 0, y: 0, z: 0 },
    color,
  });
  return createInstanceMesh({ maxCount, mesh });
};

const setArrowPosition = ({
  position,
  index,
  instanceMesh,
  angleDeg,
  length,
}) => {
  const arrowMatrix = new THREE.Matrix4();
  // Convert angles to radians
  const yRotationAngle = THREE.MathUtils.degToRad(-angleDeg);
  const zRotationAngle = THREE.MathUtils.degToRad(-90);

  // Create quaternions for each rotation
  const yRotation = new THREE.Quaternion();
  const zRotation = new THREE.Quaternion();

  // Set rotations
  yRotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yRotationAngle); // Y-axis rotation
  zRotation.setFromAxisAngle(new THREE.Vector3(0, 0, 1), zRotationAngle); // Z-axis rotation

  // Combine rotations (note: order matters: first apply Y, then Z)
  const combinedRotation = new THREE.Quaternion();
  combinedRotation.multiplyQuaternions(yRotation, zRotation);

  // Set the scale (length adjustment)
  const lengthScale = new THREE.Vector3(1, length - 0.01, 1); // Adjust X-axis to change length

  // Compose the transformation matrix
  arrowMatrix.compose(
    new THREE.Vector3(position.x, 0, position.y),
    combinedRotation,
    lengthScale
  );
  // Apply additional translation (move up by 1 unit)
  const additionalTranslation = new THREE.Matrix4().makeTranslation(0, -0.5, 0);
  arrowMatrix.multiply(additionalTranslation);
  // Apply the transformation to the instanced mesh
  instanceMesh.setMatrixAt(index, arrowMatrix);
};

const createInstance3DModelMesh = async ({ maxCount = 100, obj }) => {
  let _3dObj;
  let mesh;
  obj.mesh.traverse((obj) => {
    if (obj?.type === "Object3D") {
      obj.scale.set(obj.scale.x / 30, obj.scale.y / 30, obj.scale.z / 30);
      obj.updateMatrix();
      _3dObj = obj;
    }
    if (obj.material) {
      mesh = obj;
    }
  });

  return createInstanceMesh({ maxCount, mesh, obj: _3dObj });
};

const createGrassInstanceMesh = async ({ maxCount = 100 }) => {
  const obj = await Grass.create({
    position: { x: 0, y: 0, z: 0 },
  });
  return createInstance3DModelMesh({ maxCount, obj });
};

const createVehicleInstanceMesh = async ({ maxCount = 100 }) => {
  const obj = await Vehicle.create({
    position: { x: 0, y: 0, z: 0 },
  });
  const modelGroup = new THREE.Group();
  obj.mesh.traverse((child) => {
    if (child.isMesh) {
      const instanceMesh = new THREE.InstancedMesh(
        child.geometry, // Geometry from the loaded mesh
        child.material, // Material from the loaded mesh
        10 // Maximum number of instances
      );
      const matrix = new THREE.Matrix4();
      const scaleX = obj.scale.x / 30;
      const scaleY = obj.scale.y / 30;
      const scaleZ = obj.scale.z / 30;
      const position = new THREE.Vector3(
        child.position.x * scaleX,
        child.position.y * scaleY,
        child.position.z * scaleZ
      );
      instanceMesh.userData = position;
      const scale = new THREE.Vector3(scaleX, scaleY, scaleZ);
      matrix.compose(position, new THREE.Quaternion(), scale);
      for (let i = 0; i < instanceMesh.count; i++) {
        instanceMesh.setMatrixAt(i, matrix);
      }

      modelGroup.add(instanceMesh);
    }
  });
  modelGroup.children.forEach((insM) => {
    setInstanceMeshObjPosition({
      position: {
        x: 1 + insM.userData.x,
        y: insM.userData.y,
        z: 1 + insM.userData.z,
      },
      index: 0,
      instanceMesh: insM,
    });
  });

  return { instanceMesh: modelGroup };
  // return createInstance3DModelMesh({ maxCount, obj });
};

export {
  createPointInstanceMesh,
  setPointPosition,
  createArrowInstanceMesh,
  setArrowPosition,
  createGrassInstanceMesh,
  createVehicleInstanceMesh,
  setInstanceMeshObjPosition,
};
