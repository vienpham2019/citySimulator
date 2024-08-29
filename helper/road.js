import * as THREE from "three";

const AssignRoadMap = {
  MMMM: "╋",
  //
  MMMN: "╊",
  MNMM: "╉",
  NMMM: "╈",
  MMNM: "╇",
  //
  NMMN: "╆",
  NNMM: "╅",
  MMNN: "╄",
  MNNM: "╃",
  //
  MNMN: "╂",
  NMNM: "┿",
  //
  NNMN: "╁",
  MNNN: "╀",
  NMNN: "┾",
  NNNM: "┽",
  //
  NNNN: "┼",
  //
  "-MMM": "┳",
  "-MNM": "┯",
  "-MMN": "┲",
  "-NMM": "┱",
  "-NMN": "┰",
  "-MNN": "┮",
  "-NNM": "┭",
  "-NNN": "┬",
  //
  "M-MM": "┫",
  "N-MM": "┪",
  "M-NM": "┩",
  "M-MN": "┨",
  "N-MN": "┧",
  "M-NN": "┦",
  "N-NM": "┥",
  "N-NN": "┤",
  //
  "MM-M": "┻",
  "MM-N": "┺",
  "MN-M": "┹",
  "MN-N": "┸",
  "NM-M": "┷",
  "NM-N": "┶",
  "NN-M": "┵",
  "NN-N": "┴",
  //
  "MMM-": "┣",
  "NMM-": "┢",
  "MMN-": "┡",
  "MNM-": "┠",
  "NNM-": "┟",
  "MNN-": "┞",
  "NMN-": "┝",
  "NNN-": "├",
  //
  "M-M-": "┃",
  "M-N-": "╿",
  "N-M-": "╽",
  "N-N-": "│",
  //
  "-M-M": "━",
  "-M-N": "╼",
  "-N-M": "╾",
  "-N-N": "─",
  //
  "MM--": "┗",
  "NN--": "└",
  //
  "M--M": "┛",
  "N--N": "┘",
  //
  "-MM-": "┏",
  "-NN-": "┌",
  //
  "--MM": "┓",
  "--NN": "┐",
};

const getRoadDetails = (sign) => {
  const rotation = { x: 0, y: 0, z: 0 };
  const scale = { x: 1, y: 1, z: 1 };
  const roadUrls = {
    // Straight
    "┃━": "../models/roads/tile-mainroad-straight.glb",
    "│─": "../models/roads/tile-road-straight.glb",
    "╿╽╼╾": "../models/roads/tile-road-to-mainroad.glb",
    // Curve
    "└┘┌┐": "../models/roads/tile-road-curve.glb",
    "┗┛┏┓": "../models/roads/tile-mainroad-curve.glb",
    // Intersect
    "╋": "../models/roads/tile-mainroad-intersection.glb",
    "┼": "../models/roads/tile-road-intersection.glb",
    "╊╉╈╇": "../models/roads/tile-mainroad-road-intersection.glb",
    "╁╀┾┽": "../models/roads/tile-roads-mainroad-intersection.glb",
    "╂┿": "../models/roads/tile-road-mainroad-intersection.glb",
    // T intersect
    "┯┨┷┠": "../models/roads/tile-road-mainroad-intersection-t.glb",
    "┰┥┸┝": "../models/roads/tile-mainroad-road-intersection-t.glb",
    "┳┫┻┣": "../models/roads/tile-mainroad-intersection-t.glb",
    "┬┤┴├": "../models/roads/tile-road-intersection-t.glb",
  };

  const roadRotation = {
    "┃│╿┏┌╋┼╂╀┳┬┰┯": { ...rotation },
    "┣├━─┗└╾┝╇┠┿┽": { ...rotation, y: 90 },
    "┻┴┛┘╽┸╉┷╁": { ...rotation, y: 180 },
    "┫┤┓┐╼┥╈┨┾": { ...rotation, y: 270 },
  };
  const result = { modelUrl: null, rotation: null };
  for (const key in roadUrls) {
    if (key.includes(sign)) {
      result.modelUrl = roadUrls[key];
      break;
    }
  }

  for (const key in roadRotation) {
    if (key.includes(sign)) {
      result.rotation = roadRotation[key];
      break;
    }
  }

  // Return null or a default value if no match is found
  return result;
};

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

const isRoad = (road) => road !== null && road[0] !== " ";

const isRoadMainOrNormal = ({ type, indexs, road }) => {
  if (!isRoad(road)) return false;
  const roadVal = road[1].filter((r) => r !== "-");
  const roadCount = roadVal.length;
  if (roadCount === 2 && roadVal.every((r) => r === type)) return true;
  else {
    return (
      road[1][indexs[0]] === type ||
      (road[1][indexs[0]] === "-" &&
        road[1][indexs[1]] === type &&
        road[1][indexs[2]] === type)
    );
  }
};

const getGridElement = ({ row, col, roadGrids }) => {
  if (
    row >= 0 &&
    row < roadGrids.length &&
    col >= 0 &&
    col < roadGrids[0].length
  ) {
    return roadGrids[row][col]; // Fix index order (row first, then col)
  }
  return null; // Return null if out of bounds
};

const handleSetSymbol = async ({
  col,
  row,
  roadGrids,
  position,
  addRoadMesh,
  findMesh,
  deleteMesh,
}) => {
  const { top, right, bottom, left, self, isTop, isRight, isBottom, isLeft } =
    getNeightborRoad({
      col,
      row,
      roadGrids,
    });

  const isTopMain = isRoadMainOrNormal({
    type: "M",
    indexs: [2, 1, 3],
    road: top,
  });
  const isRightMain = isRoadMainOrNormal({
    type: "M",
    indexs: [3, 0, 2],
    road: right,
  });
  const isBottomMain = isRoadMainOrNormal({
    type: "M",
    indexs: [0, 1, 3],
    road: bottom,
  });
  const isLeftMain = isRoadMainOrNormal({
    type: "M",
    indexs: [1, 0, 2],
    road: left,
  });
  const isTopNormal = isRoadMainOrNormal({
    type: "N",
    indexs: [2, 1, 3],
    road: top,
  });
  const isRightNormal = isRoadMainOrNormal({
    type: "N",
    indexs: [3, 0, 2],
    road: right,
  });
  const isBottomNormal = isRoadMainOrNormal({
    type: "N",
    indexs: [0, 1, 3],
    road: bottom,
  });
  const isLeftNormal = isRoadMainOrNormal({
    type: "N",
    indexs: [1, 0, 2],
    road: left,
  });

  let roads = [isTop, isRight, isBottom, isLeft];
  let roadCount = roads.filter(Boolean).length;

  let roadVal = ["-", "-", "-", "-"];

  if (isTopMain) roadVal[0] = "M";
  if (isTopNormal) roadVal[0] = "N";
  if (isRightMain) roadVal[1] = "M";
  if (isRightNormal) roadVal[1] = "N";
  if (isBottomMain) roadVal[2] = "M";
  if (isBottomNormal) roadVal[2] = "N";
  if (isLeftMain) roadVal[3] = "M";
  if (isLeftNormal) roadVal[3] = "N";

  if (roadCount === 2) {
    if ((isTopMain || isBottomMain) && (isLeftNormal || isRightNormal)) {
      roadVal = ["-", "N", "-", "N"];
      if (isTopMain) roadVal[0] = "M";
      if (isBottomMain) roadVal[2] = "M";
    } else if ((isLeftMain || isRightMain) && (isTopNormal || isBottomNormal)) {
      roadVal = ["N", "-", "N", "-"];
      if (isLeftMain) roadVal[3] = "M";
      if (isRightMain) roadVal[1] = "M";
    }
  }
  if (roadCount === 3) {
    if (isTopMain && isBottomMain && (isLeftNormal || isRightNormal)) {
      roadVal = ["M", "N", "M", "N"];
    } else if (isTopNormal && isBottomNormal && (isLeftMain || isRightMain)) {
      roadVal = ["N", "M", "N", "M"];
    }
  }

  if (roadCount === 3 || roadCount === 4) {
    if (
      [`${self[1][0]}${self[1][2]}`, `${self[1][2]}${self[1][0]}`].includes(
        "MN"
      )
    ) {
      roadVal = self[1];
      if (isLeftNormal || isRightNormal) {
        roadVal[1] = "N";
        roadVal[3] = "N";
      } else if (isLeftMain || isRightMain) {
        roadVal[1] = "M";
        roadVal[3] = "M";
      }
      console.log("selfJoin", roadVal);
    } else if (
      [`${self[1][1]}${self[1][3]}`, `${self[1][3]}${self[1][1]}`].includes(
        "MN"
      )
    ) {
      roadVal = self[1];
      if (isTopNormal || isBottomNormal) {
        roadVal[0] = "N";
        roadVal[2] = "N";
      } else if (isTopMain || isBottomMain) {
        roadVal[0] = "M";
        roadVal[2] = "M";
      }
      console.log("selfJoin horizontal", roadVal, isTopNormal);
    } else if (isTop && isBottom && roadVal[0] !== roadVal[2]) {
      if (isLeft) roadVal[1] = roadVal[3];
      else if (isRight) roadVal[3] = roadVal[1];
    } else if (isLeft && isRight && roadVal[1] !== roadVal[3]) {
      if (isTop) roadVal[2] = roadVal[0];
      else if (isBottom) roadVal[0] = roadVal[2];
    }
  }
  if (roadCount === 1) {
    const selfRoadVal = self[1].filter((r) => r !== "-");
    if (isTop || isBottom) {
      roadVal = [selfRoadVal[0], "-", selfRoadVal[1], "-"];
    } else if (isLeft || isRight) {
      roadVal = ["-", selfRoadVal[0], "-", selfRoadVal[1]];
    }
    if (isTop && top[1][2] !== "-") {
      roadVal[0] = top[1][2];
    } else if (isBottom && bottom[1][0] !== "-") {
      roadVal[2] = bottom[1][0];
    } else if (isLeft && left[1][1] !== "-") {
      roadVal[3] = left[1][1];
    } else if (isRight && right[1][3] !== "-") {
      roadVal[1] = right[1][3];
    }
  }
  if (roadCount === 0) {
    roadVal = [self[1][0], self[1][3], self[1][0], self[1][3]];
  }

  const assignName = AssignRoadMap[roadVal.join("")];
  const roadMesh = findMesh({
    position,
    notInCludeName: ["Building", "Preview Road", "Vehicle", "Arrow"],
  });
  if (
    !roadMesh ||
    roadMesh?.name === "Grass" ||
    roadMesh?.name !== assignName
  ) {
    roadGrids[row][col] = [assignName, roadVal];
    if (roadMesh) deleteMesh(roadMesh);
    const { modelUrl, rotation, scale } = getRoadDetails(assignName);
    addRoadMesh({ position, name: assignName, modelUrl, rotation, scale });
  }
};

const rotateRoadValToHorizontal = (roadVal) => {
  if (roadVal[0] !== "-" && roadVal[2] !== "-") {
    return ["-", roadVal[0], "-", roadVal[2]];
  }
  return roadVal;
};

const handleAddRoadToGrid = ({
  type,
  col,
  row,
  roadGrids,
  position,
  addRoadMesh,
  findMesh,
  deleteMesh,
  addGrass,
}) => {
  const { isTop, isRight, isBottom, isLeft, isSelf } = getNeightborRoad({
    col,
    row,
    roadGrids,
  });

  const executeRoad = [];

  if (isSelf) {
    roadGrids[row][col] = [" ", ["-", "-", "-", "-"]];
    const roadMesh = findMesh({
      position,
      notInCludeName: ["Building", "Preview Road"],
    });
    deleteMesh(roadMesh);
    addGrass({ position });
  }

  if (isTop) {
    executeRoad.push({
      col,
      row: row - 1,
      position: { ...position, z: position.z - 1 },
      intersects: countIntersect({ col, row: row - 1, roadGrids }),
    });
  }
  if (isRight) {
    executeRoad.push({
      col: col + 1,
      row,
      position: { ...position, x: position.x + 1 },
      intersects: countIntersect({ col: col + 1, row, roadGrids }),
    });
  }
  if (isBottom) {
    executeRoad.push({
      col,
      row: row + 1,
      position: { ...position, z: position.z + 1 },
      intersects: countIntersect({ col, row: row + 1, roadGrids }),
    });
  }
  if (isLeft) {
    executeRoad.push({
      col: col - 1,
      row,
      position: { ...position, x: position.x - 1 },
      intersects: countIntersect({ col: col - 1, row, roadGrids }),
    });
  }
  if (!isSelf) {
    // roadGrids[row][col] = [
    //   isSelf ? " " : type === "Main" ? "━" : "─",
    //   ["-", type === "Main" ? "M" : "N", "-", type === "Main" ? "M" : "N"],
    // ];
    roadGrids[row][col] = ["━", ["-", "M", "-", "M"]];
    executeRoad.push({
      col,
      row,
      position,
      intersects: countIntersect({ col, row, roadGrids }),
    });
  }
  executeRoad.sort((a, b) => (a.intersects - b.intersects ? -1 : 1));
  executeRoad.forEach(({ col, row, position }) => {
    handleSetSymbol({
      col,
      row,
      roadGrids,
      position,
      addRoadMesh,
      findMesh,
      deleteMesh,
    });
  });
};

const countIntersect = ({ col, row, roadGrids }) => {
  const { isTop, isRight, isBottom, isLeft } = getNeightborRoad({
    col,
    row,
    roadGrids,
  });

  let intersects = [isTop, isRight, isBottom, isLeft];
  return intersects.filter(Boolean).length;
};

const getNeightborRoad = ({ col, row, roadGrids }) => {
  const top = getGridElement({ row: row - 1, col, roadGrids });
  const right = getGridElement({ row, col: col + 1, roadGrids });
  const bottom = getGridElement({ row: row + 1, col, roadGrids });
  const left = getGridElement({ row, col: col - 1, roadGrids });
  const self = getGridElement({ row, col, roadGrids });
  const isTop = isRoad(top);
  const isRight = isRoad(right);
  const isBottom = isRoad(bottom);
  const isLeft = isRoad(left);
  const isSelf = isRoad(self);
  return {
    top,
    right,
    bottom,
    left,
    self,
    isTop,
    isRight,
    isBottom,
    isLeft,
    isSelf,
  };
};

export {
  converMeshRotationToDegrees,
  printGrid,
  handleSetSymbol,
  getGridElement,
  isRoad,
  getNeightborRoad,
  handleAddRoadToGrid,
};
