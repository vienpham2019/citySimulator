import { insObjKeys } from "../enum/sence.js";
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
    });

    return roads;
  }

  updateInstanceMeshPosition({ position, index }) {
    super.updateInstanceMeshPosition({
      position: {
        x: position.x,
        y: 0,
        z: position.y,
      },
      index,
    });
  }
}
