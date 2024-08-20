import * as THREE from "three";

const converMeshRotationToDegrees = ({ _x, _y, _z }) => {
  return {
    x: THREE.MathUtils.radToDeg(_x),
    y: THREE.MathUtils.radToDeg(_y),
    z: THREE.MathUtils.radToDeg(_z),
  };
};

export { converMeshRotationToDegrees };
