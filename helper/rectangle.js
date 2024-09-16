import * as THREE from "three";
const getVertices = (rect) => {
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

// const areRectanglesColliding = (rect1Vertices, rect2Vertices) => {

// }

export { getVertices };
