import * as THREE from "three";
const verticalVertices = ({ x, y, rotation, length }) => {
  const cos = Math.cos(rotation); // rotation in radians
  const sin = Math.sin(rotation);

  // First point (origin point after applying rotation)
  const firstPoint = new THREE.Vector2(x, y);

  // Second point (moved along the length in the direction of rotation)
  const secondPoint = new THREE.Vector2(x + cos * length, y + sin * length);

  return [firstPoint, secondPoint];
};
const getRectVertices = (rect) => {
  const halfWidth = rect.width / 2;
  const halfLength = rect.length / 2;

  const cos = Math.cos(rect.rotation); // inRadians
  const sin = Math.sin(rect.rotation);

  // Vertices are calculated relative to the center of the rectangle
  return {
    TopRight: new THREE.Vector2(
      rect.x + cos * halfWidth - sin * halfLength,
      rect.y + sin * halfWidth + cos * halfLength
    ), // Top-right
    TopLeft: new THREE.Vector2(
      rect.x - cos * halfWidth - sin * halfLength,
      rect.y - sin * halfWidth + cos * halfLength
    ), // Top-left
    BottomLeft: new THREE.Vector2(
      rect.x - cos * halfWidth + sin * halfLength,
      rect.y - sin * halfWidth - cos * halfLength
    ), // Bottom-left
    BottomRight: new THREE.Vector2(
      rect.x + cos * halfWidth + sin * halfLength,
      rect.y + sin * halfWidth - cos * halfLength
    ), // Bottom-right
  };
};

export { getRectVertices, verticalVertices };
