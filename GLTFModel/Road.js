import { insObjKeys } from "../enum/sence.js";
import { straightNode } from "../node/straightNode.js";
import GLTF from "./GLTF.js";
import InstanceMesh from "./InstanceMesh.js";

export default class Road extends InstanceMesh {
  static base = { x: 1, z: 1 };
  static offset = { x: 0, y: 0 };
  static roadUrls = {
    [insObjKeys.Road_Straight]: "../models/roads/tile-mainroad-straight.glb",
    [insObjKeys.Road_Curve]: "../models/roads/tile-mainroad-curve.glb",
    [insObjKeys.Road_Intersect]:
      "../models/roads/tile-mainroad-intersection.glb",
    [insObjKeys.Road_T_Intersect]:
      "../models/roads/tile-mainroad-intersection-t.glb",
  };
  constructor({ maxInstance, modelUrl = Road.roadUrls.Straight }) {
    super();
    this.maxInstance = maxInstance;
    this.name = "Road";
    this.scale = { x: 3.34, y: 3.34, z: 3.34 };
    this.modelUrl = modelUrl;
    this.prevHilightIndex = [];
  }

  static async create({ maxInstance = 10 }) {
    const roads = {};
    // Use Promise.all with map to handle async/await properly
    const roadEntries = await Promise.all(
      Object.entries(Road.roadUrls).map(async ([key, url]) => {
        const obj = await GLTF.create({
          obj: new Road({ maxInstance, modelUrl: url }),
          position: {
            x: 0,
            y: 0,
            z: 0,
          },
        });
        obj.createInstanceMesh();
        return [key, obj]; // Return the key and the created object as a pair
      })
    );

    // Fill the roads object with the returned key-object pairs
    roadEntries.forEach(([key, obj]) => {
      roads[key] = obj;
      obj.updateInstanceMeshPosition({
        position: { x: 0, y: -0.2, z: 0 },
        index: 0,
      });
    });

    return roads;
  }
  static calculateIndexByPosition({ position, s_width, s_length }) {
    const x_Offset = Math.floor(s_width / 2);
    const y_Offset = Math.floor(s_length / 2);
    return position.x + x_Offset + (position.y + y_Offset) * s_length;
  }

  static getRoadNeightbor({
    s_width,
    s_length,
    position,
    platformGrids,
    roadGrids,
  }) {
    const selfIndex = Road.calculateIndexByPosition({
      s_width,
      s_length,
      position,
    });
    const topIndex = Road.calculateIndexByPosition({
      s_width,
      s_length,
      position: { x: position.x, y: position.y - 1 },
    });
    const rightIndex = Road.calculateIndexByPosition({
      s_width,
      s_length,
      position: { x: position.x + 1, y: position.y },
    });
    const bottomIndex = Road.calculateIndexByPosition({
      s_width,
      s_length,
      position: { x: position.x, y: position.y + 1 },
    });
    const leftIndex = Road.calculateIndexByPosition({
      s_width,
      s_length,
      position: { x: position.x - 1, y: position.y },
    });
    const isRoad = (index) => platformGrids[index].includes("Road");

    const isSelfRoad = isRoad(selfIndex);
    const isTopRoad = topIndex > 0 && isRoad(topIndex);
    const isRightRoad =
      rightIndex <=
        Road.calculateIndexByPosition({
          s_width,
          s_length,
          position: { x: s_width - 1 - Math.floor(s_width / 2), y: position.y },
        }) && isRoad(rightIndex);
    const isBottomRoad =
      bottomIndex < s_width * s_length && isRoad(bottomIndex);
    const isLeftRoad =
      leftIndex >=
        Road.calculateIndexByPosition({
          s_width,
          s_length,
          position: { x: -Math.floor(s_width / 2), y: position.y },
        }) && isRoad(leftIndex);
    const self = roadGrids[selfIndex];
    const top = roadGrids[topIndex];
    const right = roadGrids[rightIndex];
    const bottom = roadGrids[bottomIndex];
    const left = roadGrids[leftIndex];

    return {
      isSelfRoad,
      isTopRoad,
      isRightRoad,
      isBottomRoad,
      isLeftRoad,
      selfIndex,
      topIndex,
      rightIndex,
      bottomIndex,
      leftIndex,
      self,
      top,
      right,
      bottom,
      left,
    };
  }

  static addRoad({
    index,
    position,
    roadGrids,
    platformGrids,
    s_width,
    s_length,
    instanceObjs,
    nodes,
  }) {
    const { isSelfRoad, isTopRoad, isRightRoad, isBottomRoad, isLeftRoad } =
      Road.getRoadNeightbor({
        s_width,
        s_length,
        position,
        platformGrids,
        roadGrids,
      });
    const executeRoad = [];
    if (isSelfRoad) {
      //Replace road with grass
      Road.updatePlatformRoad({
        instanceObjs,
        instanceId: index,
        currentObj: {
          key: platformGrids[index],
        },
        updateObj: {
          key: insObjKeys.Grass,
          position,
          angleRadians: 0,
        },
      });
      platformGrids[index] = insObjKeys.Grass;
      delete roadGrids[index];
    }

    const countIntersect = (countIntersectPosition) => {
      const { isTopRoad, isRightRoad, isBottomRoad, isLeftRoad } =
        Road.getRoadNeightbor({
          s_width,
          s_length,
          position: countIntersectPosition,
          platformGrids,
          roadGrids,
        });

      let intersects = [isTopRoad, isRightRoad, isBottomRoad, isLeftRoad];
      return intersects.filter(Boolean).length;
    };

    if (isTopRoad) {
      executeRoad.push({
        position: { ...position, y: position.y - 1 },
        intersects: countIntersect({ ...position, y: position.y - 1 }),
      });
    }
    if (isRightRoad) {
      executeRoad.push({
        position: { ...position, x: position.x + 1 },
        intersects: countIntersect({ ...position, x: position.x + 1 }),
      });
    }
    if (isBottomRoad) {
      executeRoad.push({
        position: { ...position, y: position.y + 1 },
        intersects: countIntersect({ ...position, y: position.y + 1 }),
      });
    }
    if (isLeftRoad) {
      executeRoad.push({
        position: { ...position, x: position.x - 1 },
        intersects: countIntersect({ ...position, x: position.x - 1 }),
      });
    }
    if (!isSelfRoad) {
      roadGrids[index] = ["M", "-", "M", "-"];
      platformGrids[index] = insObjKeys.Road_Straight;
      nodes[`${position.x}${position.y}`] = straightNode({
        isIntersect: true,
        isVertical: true,
        position,
      });
      Road.updatePlatformRoad({
        instanceObjs,
        instanceId: index,
        currentObj: {
          key: insObjKeys.Grass,
        },
        updateObj: {
          key: insObjKeys.Road_Straight,
          position,
          angleRadians: 0,
        },
      });
      executeRoad.push({
        position,
        intersects: countIntersect(position),
      });
    }

    if (executeRoad.length > 1) {
      executeRoad.sort((a, b) => (a.intersects - b.intersects ? -1 : 1));
      executeRoad.forEach(({ position }) => {
        Road.handleSetRoad({
          roadGrids,
          position,
          platformGrids,
          s_width,
          s_length,
          instanceObjs,
          nodes,
        });
      });
    }
  }

  static handleSetRoad({
    roadGrids,
    position,
    platformGrids,
    s_width,
    s_length,
    instanceObjs,
    nodes,
  }) {
    const {
      self,
      top,
      right,
      bottom,
      left,
      selfIndex,
      isTopRoad,
      isRightRoad,
      isBottomRoad,
      isLeftRoad,
    } = Road.getRoadNeightbor({
      s_width,
      s_length,
      position,
      platformGrids,
      roadGrids,
    });

    let roads = [isTopRoad, isRightRoad, isBottomRoad, isLeftRoad];
    let roadCount = roads.filter(Boolean).length;

    let roadVal = ["-", "-", "-", "-"];
    if (isTopRoad) roadVal[0] = "M";
    if (isRightRoad) roadVal[1] = "M";
    if (isBottomRoad) roadVal[2] = "M";
    if (isLeftRoad) roadVal[3] = "M";

    if (roadCount === 1) {
      const selfRoadVal = self.filter((r) => r !== "-");
      if (isTopRoad || isBottomRoad) {
        roadVal = [selfRoadVal[0], "-", selfRoadVal[1], "-"];
      } else if (isLeftRoad || isRightRoad) {
        roadVal = ["-", selfRoadVal[0], "-", selfRoadVal[1]];
      }
      if (isTopRoad && top[2] !== "-") {
        roadVal[0] = top[2];
      } else if (isBottomRoad && bottom[0] !== "-") {
        roadVal[2] = bottom[0];
      } else if (isLeftRoad && left[1] !== "-") {
        roadVal[3] = left[1];
      } else if (isRightRoad && right[3] !== "-") {
        roadVal[1] = right[3];
      }
    }

    let angleRadians = 0;
    let roadKey = insObjKeys.Road_Straight;
    let node;
    const isRoad = (index) => roadVal[index] !== "-";
    if (roadCount === 4) {
      roadKey = insObjKeys.Road_Intersect;
    } else if (roadCount === 3) {
      roadKey = insObjKeys.Road_T_Intersect;
      if (!isRoad(1)) angleRadians = -Math.PI / 2;
      else if (!isRoad(2)) angleRadians = -Math.PI;
      else if (!isRoad(3)) angleRadians = Math.PI / 2;
    } else {
      // Vertical straight road
      if (isRoad(1) && isRoad(3)) {
        angleRadians = Math.PI / 2;
        node = straightNode({
          isIntersect: true,
          isVertical: false,
          position,
        });
      } else if (isRoad(0) && isRoad(2)) {
        node = straightNode({
          isIntersect: true,
          isVertical: true,
          position,
        });
      }

      // Curve road
      if ((isRoad(0) || isRoad(2)) && (isRoad(1) || isRoad(3))) {
        roadKey = insObjKeys.Road_Curve;
        if (isRoad(0) && isRoad(1)) angleRadians = Math.PI / 2;
        else if (isRoad(2) && isRoad(3)) angleRadians = -Math.PI / 2;
        else if (isRoad(0) && isRoad(3)) angleRadians = Math.PI;
      }
    }

    nodes[`${position.x}${position.y}`] = node;

    roadGrids[selfIndex] = roadVal;
    Road.updatePlatformRoad({
      instanceObjs,
      instanceId: selfIndex,
      currentObj: {
        key: platformGrids[selfIndex],
      },
      updateObj: {
        key: roadKey,
        position,
        angleRadians,
      },
    });
    platformGrids[selfIndex] = roadKey;
  }

  static updatePlatformRoad({
    instanceObjs,
    instanceId,
    currentObj,
    updateObj,
  }) {
    instanceObjs[currentObj.key].updateInstanceMeshPosition({
      position: { x: 1e10, y: 1e10 },
      index: instanceId,
    });
    instanceObjs[updateObj.key].updateInstanceMeshPosition({
      position: updateObj.position,
      index: instanceId,
      angleRadians: updateObj.angleRadians,
    });
  }

  updateInstanceMeshPosition({ position, index, angleRadians = 0 }) {
    if (position.z === null || position.z === undefined) {
      position = {
        x: position.x,
        y: 0,
        z: position.y,
      };
    }
    super.updateInstanceMeshPosition({
      position,
      index,
      angleRadians,
    });
  }
}
