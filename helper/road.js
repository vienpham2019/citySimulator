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

const roadUrls = [
  "../models/roads/tile-mainroad-curve.glb", // 0
  "../models/roads/tile-mainroad-intersection.glb", // 1
  "../models/roads/tile-mainroad-intersection-t.glb", // 2
  "../models/roads/tile-mainroad-road-intersection-t.glb", // 3
  "../models/roads/tile-mainroad-road-intersection.glb", // 4
  "../models/roads/tile-mainroad-straight.glb", // 5
  "../models/roads/tile-road-curve.glb", // 6
  "../models/roads/tile-road-intersection-t.glb", // 7
  "../models/roads/tile-road-mainroad-intersection-t.glb", // 8
  "../models/roads/tile-road-mainroad-intersection.glb", // 9
  "../models/roads/tile-road-straight.glb", // 10
  "../models/roads/tile-road-to-mainroad-intersection-t.glb", // 11
  "../models/roads/tile-road-to-mainroad.glb", // 12
  "../models/roads/tile-roads-mainroad-intersection.glb", // 13
  "../models/roads/tile-road-intersection.glb", // 14
];
let rotation = { x: 0, y: 0, z: 0 };
const roadUrlDetails = {
  "╋": {
    url: roadUrls[1],
    rotation,
  },
  "┳": {
    url: roadUrls[2],
    rotation,
  },
  "┫": {
    url: roadUrls[2],
    rotation: { ...rotation, y: 270 },
  },
  "┻": {
    url: roadUrls[2],
    rotation: { ...rotation, y: 180 },
  },
  "┣": {
    url: roadUrls[2],
    rotation: { ...rotation, y: 90 },
  },
  "┃": {
    url: roadUrls[5],
    rotation,
  },
  "━": {
    url: roadUrls[5],
    rotation: { ...rotation, y: 90 },
  },
  "┗": {
    url: roadUrls[0],
    rotation: { ...rotation, y: 90 },
  },
  "┛": {
    url: roadUrls[0],
    rotation: { ...rotation, y: 180 },
  },
  "┏": {
    url: roadUrls[0],
    rotation,
  },
  "┓": {
    url: roadUrls[0],
    rotation: { ...rotation, y: 270 },
  },
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

const isJoinHorizontal = (road) => {
  if (!road) return false;
  const count = road.filter((r) => r !== "-").length;
  if (count !== 2) return;
  const signRight = road[1][1];
  const signLeft = road[1][3];
  if (signRight !== "-" && signLeft !== "-") {
    return signRight !== signLeft;
  }
  return false;
};

const isJoinVertical = (road) => {
  if (!road) return false;
  const count = road.filter((r) => r !== "-").length;
  if (count !== 2) return;
  const signTop = road[1][0];
  const signBottom = road[1][2];
  if (signTop !== "-" && signBottom !== "-") {
    return signTop !== signBottom;
  }
  return false;
};

const isRoad = (road) => road !== null && road[0] !== " ";

const isRoadMainOrNormal = ({ type, indexs, road }) => {
  if (!isRoad(road)) return false;
  return (
    road[1][indexs[0]] === type ||
    (road[1][indexs[0]] === "-" &&
      road[1][indexs[1]] === type &&
      road[1][indexs[2]] === type)
  );
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

  const isSelfJoinVertical = isJoinVertical(self);
  const isSelfJoinHorizontal = isJoinHorizontal(self);

  let roads = [isTop, isRight, isBottom, isLeft];
  let roadCount = roads.filter(Boolean).length;

  let roadVal = ["-", "-", "-", "-"];
  if (roadCount === 2) {
    if (isSelfJoinHorizontal) roadVal = ["-", self[1][1], "-", self[1][3]];
    else if (isSelfJoinVertical) roadVal = [self[1][0], "-", self[1][2], "-"];
    else if ((isTop || isBottom) && (isLeft || isRight)) {
      let setVertical = "-";
      if (isTop) {
        setVertical = isTopMain ? "M" : isTopNormal ? "N" : top[1][2];
      }
      if (isBottom) {
        setVertical = isBottomMain ? "M" : isBottomNormal ? "N" : bottom[1][0];
      }
      let setHorizontal = "-";
      if (isLeft) {
        setHorizontal = isLeftMain ? "M" : isLeftNormal ? "N" : left[1][1];
      }
      if (isRight) {
        setHorizontal = isRightMain ? "M" : isRightNormal ? "N" : right[1][3];
      }

      if (setHorizontal !== setVertical) {
        roadVal = [setVertical, setHorizontal, setVertical, setHorizontal];
      }
    }
  }
  if (isTopMain) roadVal[0] = "M";
  if (isTopNormal) roadVal[0] = "N";
  if (isRightMain) roadVal[1] = "M";
  if (isRightNormal) roadVal[1] = "N";
  if (isBottomMain) roadVal[2] = "M";
  if (isBottomNormal) roadVal[2] = "N";
  if (isLeftMain) roadVal[3] = "M";
  if (isLeftNormal) roadVal[3] = "N";

  if (roadCount === 1) {
    if (isTop) roadVal[2] = roadVal[0];
    else if (isBottom) roadVal[0] = roadVal[2];
    else if (isLeft) roadVal[1] = roadVal[3];
    else if (isRight) roadVal[3] = roadVal[1];
  } else if (roadCount === 0) {
    roadVal = [self[1][0], self[1][3], self[1][0], self[1][3]];
  }

  const assignName = AssignRoadMap[roadVal.join("")];
  const roadMesh = findMesh({ position });
  if (!roadMesh || roadMesh?.name !== assignName) {
    roadGrids[row][col] = [assignName, roadVal];
    if (roadMesh) deleteMesh(roadMesh);
    const { url: modelUrl, rotation } = roadUrlDetails[assignName];
    addRoadMesh({ position, name: assignName, modelUrl, rotation });
  }
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
}) => {
  const { isTop, isRight, isBottom, isLeft, isSelf } = getNeightborRoad({
    col,
    row,
    roadGrids,
  });

  roadGrids[row][col] = [
    isSelf ? " " : type === "Main" ? "━" : "─",
    ["-", type === "Main" ? "M" : "N", "-", type === "Main" ? "M" : "N"],
  ];
  if (isTop)
    handleSetSymbol({
      col,
      row: row - 1,
      roadGrids,
      position: { ...position, z: position.z - 1 },
      addRoadMesh,
      findMesh,
      deleteMesh,
    }); // top
  if (isRight)
    handleSetSymbol({
      col: col + 1,
      row,
      roadGrids,
      position: { ...position, x: position.x + 1 },
      addRoadMesh,
      findMesh,
      deleteMesh,
    }); // right
  if (isBottom)
    handleSetSymbol({
      col,
      row: row + 1,
      roadGrids,
      position: { ...position, z: position.z + 1 },
      addRoadMesh,
      findMesh,
      deleteMesh,
    }); // bottom
  if (isLeft)
    handleSetSymbol({
      col: col - 1,
      row,
      roadGrids,
      position: { ...position, x: position.x - 1 },
      addRoadMesh,
      findMesh,
      deleteMesh,
    }); // left
  if (!isSelf)
    handleSetSymbol({
      col,
      row,
      roadGrids,
      position,
      addRoadMesh,
      findMesh,
      deleteMesh,
    }); // selft
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
  roadUrlDetails,
  converMeshRotationToDegrees,
  printGrid,
  handleSetSymbol,
  getGridElement,
  isRoad,
  getNeightborRoad,
  handleAddRoadToGrid,
};
