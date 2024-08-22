import * as THREE from "three";

import Grass from "./Grass.js";
import IndustryFactory from "./buildings/IndustryFactory.js";
import { converMeshRotationToDegrees, printGrid } from "./helper.js";
import Road from "./buildings/Road.js";
const w = window.innerWidth;
const h = window.innerHeight;

export default class Scene {
  constructor({ width = 10, length = 10 }) {
    // Initialize scene, camera, and renderer
    this.s_width = width;
    this.s_length = length;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
    this.camera.position.z = width;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(w, h);

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Append renderer to the DOM
    this.grid = [];
    this.roadGrids = [];
    this.setupLights({ width, length });
    this.setUpPlatform({ width, length });
    this.buildingsToGrow = [];
    this.hoverObjects = [];
    this.previewModel = null;
  }

  async init() {
    this.previewModel = await Road.create({
      x: 0,
      y: 0,
      isPreview: true,
    });
    this.scene.add(this.previewModel.mesh);
  }

  async setUpPlatform({ width, length }) {
    const roads = [
      "models/roads/tile-mainroad-curve.glb",
      "models/roads/tile-mainroad-intersection.glb",
      "models/roads/tile-mainroad-road-intersection-t.glb",
      "models/roads/tile-mainroad-road-intersection.glb",
      "models/roads/tile-mainroad-straight-crosswalk.glb",
      "models/roads/tile-mainroad-straight.glb",
      "models/roads/tile-road-curve.glb",
      "models/roads/tile-road-end.glb",
      "models/roads/tile-road-intersection-t.glb",
      "models/roads/tile-road-mainroad-intersection-t.glb",
      "models/roads/tile-road-mainroad-intersection.glb",
      "models/roads/tile-road-straight.glb",
      "models/roads/tile-road-to-mainroad-intersection-t.glb",
      "models/roads/tile-road-to-mainroad.glb",
      "models/roads/tile-roads-mainroad-intersection.glb",
      "models/roads/tile-road-intersection.glb",
    ];
    let r = 0;
    for (let x = 0; x < width; x++) {
      this.grid[x] = [];
      this.roadGrids[x] = [];
      for (let y = 0; y < length; y++) {
        let x_pos = x - Math.floor(width / 2);
        let y_pos = y - Math.floor(length / 2);
        const grass = new Grass({ x: x_pos, y: y_pos });
        // if (r < roads.length) {
        //   const newRoad = await Road.create({
        //     position: { x: x_pos, y: y_pos },
        //     modelUrl: `../${roads[r++]}`,
        //   });
        //   this.scene.add(newRoad.mesh);
        // }

        this.grid[x][y] = grass;
        this.roadGrids[x][y] = [" ", ["", "", "", ""]];
        this.scene.add(grass.mesh);
      }
    }
  }

  setupLights({ width, length }) {
    const sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.position.set(20, 20, 20);
    sun.castShadow = true;
    sun.shadow.camera.left = -width;
    sun.shadow.camera.right = length;
    sun.shadow.camera.top = 10;
    sun.shadow.camera.bottom = -10;
    sun.shadow.camera.near = 0.5; // default
    sun.shadow.camera.far = 100; // default
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    this.scene.add(sun);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    //Create a helper for the shadow camera (optional)
    // const helper = new THREE.CameraHelper(sun.shadow.camera);
    // this.scene.add(helper);
    this.buildings = [];
    this.selectRoad = "Main";
  }

  draw = () => {
    this.renderer.render(this.scene, this.camera);
  };

  start() {
    this.renderer.setAnimationLoop(this.draw);
  }

  stop() {
    this.renderer.setAnimationLoop(null);
  }

  async handleAddObject() {
    const colisions = this.buildings.filter((building) =>
      this.previewModel.isColision(building)
    );
    if (colisions.length > 0) return;
    let { position, rotation } = this.previewModel.mesh;
    position = { x: position.x, y: position.z };
    rotation = converMeshRotationToDegrees(rotation);

    const road = await Road.create({
      position,
    });

    this.scene.add(road.mesh);
  }
  getGridElement(row, col) {
    if (
      row >= 0 &&
      row < this.roadGrids.length &&
      col >= 0 &&
      col < this.roadGrids[0].length
    ) {
      return this.roadGrids[row][col]; // Fix index order (row first, then col)
    }
    return null; // Return null if out of bounds
  }

  handleSetSymbol({ col, row }) {
    let top = this.getGridElement(row - 1, col);
    let right = this.getGridElement(row, col + 1);
    let bottom = this.getGridElement(row + 1, col);
    let left = this.getGridElement(row, col - 1);
    let self = this.getGridElement(row, col);

    const isRoad = (road) => road !== null && road[0] !== " ";

    let isTop = isRoad(top);
    let isRight = isRoad(right);
    let isBottom = isRoad(bottom);
    let isLeft = isRoad(left);

    const isRoadMainOrNormal = ({ type, indexs, road }) => {
      if (!isRoad(road)) return false;
      return (
        road[1][indexs[0]] === type ||
        (road[1][indexs[0]] === "-" &&
          road[1][indexs[1]] === type &&
          road[1][indexs[2]] === type)
      );
    };

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
          setVertical = isBottomMain
            ? "M"
            : isBottomNormal
            ? "N"
            : bottom[1][0];
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
      if (isTop) {
        roadVal[2] = self[1][2] !== "-" ? self[1][2] : self[1][1];
      } else if (isBottom) {
        roadVal[0] = self[1][0] !== "-" ? self[1][0] : self[1][1];
      } else if (isLeft) {
        roadVal[1] = self[1][1] !== "-" ? self[1][1] : self[1][0];
      } else if (isRight) {
        roadVal[3] = self[1][3] !== "-" ? self[1][3] : self[1][0];
      }
    } else if (roadCount === 0) {
      roadVal = [self[1][0], self[1][3], self[1][0], self[1][3]];
    }

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

    this.roadGrids[row][col] = [AssignRoadMap[roadVal.join("")], roadVal];
  }

  handleRoadGrid() {
    let { position } = this.previewModel.mesh;
    let col = position.x + Math.floor(this.s_length / 2);
    let row = position.z + Math.floor(this.s_width / 2);

    let top = this.getGridElement(row - 1, col);
    let right = this.getGridElement(row, col + 1);
    let bottom = this.getGridElement(row + 1, col);
    let left = this.getGridElement(row, col - 1);
    let self = this.getGridElement(row, col);

    const isRoad = (road) => road !== null && road[0] !== " ";

    let isTop = isRoad(top);
    let isRight = isRoad(right);
    let isBottom = isRoad(bottom);
    let isLeft = isRoad(left);
    let isSelf = isRoad(self);

    this.roadGrids[row][col] = [
      isSelf ? " " : this.selectRoad === "Main" ? "━" : "─",
      [
        "-",
        this.selectRoad === "Main" ? "M" : "N",
        "-",
        this.selectRoad === "Main" ? "M" : "N",
      ],
    ];
    if (isTop) this.handleSetSymbol({ col, row: row - 1 }); // top
    if (isRight) this.handleSetSymbol({ col: col + 1, row }); // right
    if (isBottom) this.handleSetSymbol({ col, row: row + 1 }); // bottom
    if (isLeft) this.handleSetSymbol({ col: col - 1, row }); // left
    if (!isSelf) this.handleSetSymbol({ col, row }); // selft
    printGrid(this.roadGrids);
  }

  async handleAddRoad() {
    this.handleRoadGrid();
    let { position } = this.previewModel.mesh;
    position = { x: position.x, y: position.z };
    let rotation = { x: 0, y: 0, z: 0 };
    let roadsUrl = {
      MainStraigh: "../models/roads/tile-mainroad-straight.glb",
      MainCurve: "../models/roads/tile-mainroad-curve.glb",
      MainTIntersect: "../models/roads/tile-mainroad-intersection-t.glb",
      MainIntersect: "../models/roads/tile-mainroad-intersection.glb",
    };
    let modelUrl = roadsUrl.MainStraigh;
    let roadName = "Road_MainStraight";
    let row = position.y + Math.floor(this.s_length / 2);
    let col = position.x + Math.floor(this.s_width / 2);

    const getGridElement = (row, col) => {
      if (
        row >= 0 &&
        row < this.grid.length &&
        col >= 0 &&
        col < this.grid[0].length
      ) {
        return this.grid[row][col];
      }
      return null; // Return null if out of bounds
    };

    let top = getGridElement(row - 1, col);
    let right = getGridElement(row, col + 1);
    let bottom = getGridElement(row + 1, col);
    let left = getGridElement(row, col - 1);

    let topLeft = getGridElement(row - 1, col - 1);
    let topRight = getGridElement(row - 1, col + 1);
    let bottomLeft = getGridElement(row + 1, col - 1);
    let bottomRight = getGridElement(row + 1, col + 1);

    const isRoad = (road) => road && road.mesh.name.split("_")[0] === "Road";

    let isTop = isRoad(top);
    let isRight = isRoad(right);
    let isBottom = isRoad(bottom);
    let isLeft = isRoad(left);

    let isTopLeft = isRoad(topLeft);
    let isTopRight = isRoad(topRight);
    let isBottomLeft = isRoad(bottomLeft);
    let isBottomRight = isRoad(bottomRight);
    // Put the conditions into an array
    let roads = [isTop, isRight, isBottom, isLeft];

    // Count how many true values are in the array
    let roadCount = roads.filter(Boolean).length;

    let isIntersect = roadCount === 4;
    let isTIntersect = roadCount === 3;

    const updateRoad = {
      Curve: {
        name: "Road_MainCurve",
        checkName: "Road_MainStraight",
        modelUrl: roadsUrl.MainCurve,
        setRotation: { ...rotation },
      },
      TIntersect: {
        name: "Road_MainTIntersect",
        checkName: "Road_MainStraight",
        modelUrl: roadsUrl.MainTIntersect,
        setRotation: { ...rotation },
      },
      Intersect: {
        name: "Road_MainIntersect",
        checkName: "Road_MainTIntersect",
        modelUrl: roadsUrl.MainIntersect,
      },
    };
    const isTIntersectRoad = (road) => {
      return road.mesh.name === "Road_MainTIntersect";
    };
    const isCurveRoad = (road) => {
      return road.mesh.name === "Road_MainCurve";
    };

    let updateRoadParams;
    const checkNeighborRoad = ({
      road,
      isRoad,
      isRoadCorner1,
      isRoadCorner2,
      row,
      col,
      rotation,
    }) => {
      if (isRoad && (isRoadCorner1 || isRoadCorner2)) {
        if (isCurveRoad(road)) {
          updateRoadParams = updateRoad.TIntersect;
          updateRoadParams.checkName = "Road_MainCurve";
          updateRoadParams.setRotation.y = rotation.curve_tIntersect;
        } else if (isRoadCorner1 && isRoadCorner2) {
          updateRoadParams = updateRoad.TIntersect;
          updateRoadParams.setRotation.y = rotation.straight_tIntersect;
          if (isTIntersectRoad(road)) {
            updateRoadParams = updateRoad.Intersect;
          }
        } else {
          updateRoadParams = updateRoad.Curve;
          updateRoadParams.setRotation.y = rotation.straight_curve;
        }
        this.updateRoadMesh({
          road,
          row,
          col,
          ...updateRoadParams,
        });
      }
    };

    checkNeighborRoad({
      road: top,
      isRoad: isTop,
      isRoadCorner1: isTopLeft,
      isRoadCorner2: isTopRight,
      row: row - 1,
      col,
      rotation: {
        curve_tIntersect: isTopLeft ? -90 : 90,
        straight_curve: isTopLeft ? -90 : 0,
        straight_tIntersect: 0,
      },
    });

    checkNeighborRoad({
      road: bottom,
      isRoad: isBottom,
      isRoadCorner1: isBottomLeft,
      isRoadCorner2: isBottomRight,
      row: row + 1,
      col,
      rotation: {
        curve_tIntersect: isBottomLeft ? -90 : 90,
        straight_curve: isBottomLeft ? 180 : 90,
        straight_tIntersect: 180,
      },
    });

    checkNeighborRoad({
      road: right,
      isRoad: isRight,
      isRoadCorner1: isTopRight,
      isRoadCorner2: isBottomRight,
      row,
      col: col + 1,
      rotation: {
        curve_tIntersect: isTopRight ? 180 : 0,
        straight_curve: isTopRight ? 180 : -90, // 180 , -90
        straight_tIntersect: -90,
      },
    });

    checkNeighborRoad({
      road: left,
      isRoad: isLeft,
      isRoadCorner1: isTopLeft,
      isRoadCorner2: isBottomLeft,
      row,
      col: col - 1,
      rotation: {
        curve_tIntersect: isTopLeft ? 90 : 0,
        straight_curve: isTopLeft ? 90 : 0,
        straight_tIntersect: 90,
      },
    });

    if (isIntersect) {
      roadName = "Road_MainIntersect";
      modelUrl = roadsUrl.MainIntersect;
    } else if (isTIntersect) {
      modelUrl = roadsUrl.MainTIntersect;
      roadName = "Road_MainTIntersect";
      if (!isLeft) rotation.y = -90;
      if (!isRight) rotation.y = 90;
      if (!isBottom) rotation.y = 180;
    } else if (
      ((isTop && !isBottom) || (isBottom && !isTop)) &&
      roadCount === 2
    ) {
      modelUrl = roadsUrl.MainCurve;
      roadName = "Road_MainCurve";
      if (isTop && isRight) rotation.y = 90;
      if (isTop && isLeft) rotation.y = 180;
      if (isLeft && isBottom) rotation.y = 270;
    } else {
      if (isLeft) rotation.y = 90;
      if (isRight) rotation.y = -90;
    }

    const isStraightRoad = (road) => {
      return road && road.mesh.name === "Road_MainStraight";
    };

    if (isTop && isStraightRoad(top)) {
      top.setRotate({ x: 0, y: 0, z: 0 });
    }
    if (isBottom && isStraightRoad(bottom)) {
      bottom.setRotate({ x: 0, y: 0, z: 0 });
    }
    if (isLeft && isStraightRoad(left)) {
      left.setRotate({ x: 0, y: 90, z: 0 });
    }
    if (isRight && isStraightRoad(right)) {
      right.setRotate({ x: 0, y: 90, z: 0 });
    }

    const road = await Road.create({
      position,
      name: roadName,
      modelUrl,
    });
    road.setRotate(rotation);
    this.grid[row][col] = road;
    this.scene.add(road.mesh);
  }

  async updateRoadMesh({
    road,
    row,
    col,
    setRotation = { x: 0, y: 0, z: 0 },
    name,
    checkName,
    modelUrl,
  }) {
    if (road && road.mesh.name === checkName) {
      const newRoad = await Road.create({
        position: road.position,
        name,
        modelUrl,
      });
      this.deleteMesh(road.mesh);
      newRoad.rotate(setRotation);
      this.scene.add(newRoad.mesh);
      this.grid[row][col] = newRoad;
    }
  }

  deleteMesh(mesh) {
    if (mesh) {
      // Remove the mesh from the scene
      this.scene.remove(mesh);

      // Dispose of the mesh's geometry and material to free up memory
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material) {
        // If the material is an array (e.g., when using multi-materials), dispose of each one
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((material) => material.dispose());
        } else {
          mesh.material.dispose();
        }
      }

      // Optionally, set the mesh reference to null
      mesh = null;
    }
  }

  onSelectObject(e) {
    this.updateMousePosition(e);
    const intersections = this.getIntersections();
    if (intersections.length > 0) {
      this.handleAddRoad();
    }
  }

  onHoverObject(e) {
    this.updateMousePosition(e);
    const intersections = this.getIntersections();

    if (intersections.length > 0) {
      if (this.hoverObjects.length) {
        this.hoverObjects.forEach((c) => c.material.emissive.setHex(0));
      }
      const corner = intersections[0].object;
      this.hoverObjects = this.getChildrenInGrid(corner.position, Road.base);
      const { x, z } = this.hoverObjects[0].position;
      this.previewModel.updatePosition({ x, z });
      const colisions = this.buildings.filter((building) =>
        this.previewModel.isColision(building)
      );
      this.previewModel.setIsCollision(colisions.length > 0);

      this.hoverObjects.forEach((c) => {
        if (c.name === "Grass") c.material.emissive.setHex(0x555555);
      });
    } else {
      if (this.hoverObjects.length > 0) {
        this.hoverObjects.forEach((c) => {
          if (c.name === "Grass") c.material.emissive.setHex(0);
        });
        this.hoverObjects = [];
      }
    }
  }

  //x is width and z is length
  getChildrenInGrid(cornerPosition, gridSize = { x: 1, z: 1 }) {
    const childrenInGrid = [];

    // Ensure cornerPosition is the top-left corner
    let { x: cornerX, z: cornerZ } = cornerPosition;
    if (cornerX + gridSize.x > Math.floor(this.s_width / 2)) {
      cornerX = Math.floor(this.s_width / 2) - gridSize.x;
    }

    if (cornerZ + gridSize.z > Math.floor(this.s_length / 2)) {
      cornerZ = Math.floor(this.s_length / 2) - gridSize.z;
    }

    // Traverse through all children in the scene
    this.scene.traverse((child) => {
      if (child.isMesh) {
        const position = child.position;

        // Check if the child's position is within the grid bounds
        if (
          position.x >= cornerX &&
          position.x < cornerX + gridSize.x &&
          position.z >= cornerZ &&
          position.z < cornerZ + gridSize.z
        ) {
          childrenInGrid.push(child);
        }
      }
    });

    return childrenInGrid;
  }

  updateMousePosition(e) {
    this.mouse.x = (e.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / this.renderer.domElement.clientHeight) * 2 + 1;
  }

  getIntersections() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    return this.raycaster.intersectObjects(this.scene.children, false);
  }
}
