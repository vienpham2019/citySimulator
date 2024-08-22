import * as THREE from "three";

const converMeshRotationToDegrees = ({ _x, _y, _z }) => {
  return {
    x: THREE.MathUtils.radToDeg(_x),
    y: THREE.MathUtils.radToDeg(_y),
    z: THREE.MathUtils.radToDeg(_z),
  };
};
const printGrid = (grid) => {
  for (let row = 0; row < grid.length; row++) {
    let rowStr = "";
    for (let col = 0; col < grid[row].length; col++) {
      if (grid[row][col][0]) {
        rowStr += grid[row][col][0].padEnd(5, ""); // Concatenate the elements with a space for better readability
      } else {
        rowStr += "?";
      }
    }
    console.log(`%c${rowStr}`, "font-size: 20px"); // Print each row on a new line
  }
};

export { converMeshRotationToDegrees, printGrid };
