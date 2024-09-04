import * as THREE from "three";

import Grass from "./Grass.js";
import IndustryFactory from "./buildings/IndustryFactory.js";
import {
  converMeshRotationToDegrees,
  handleAddRoadToGrid,
  printGrid,
} from "./helper/road.js";
import Road from "./buildings/Road.js";
import Vehicle from "./buildings/Vehicle.js";
import Geometry from "./Geometry.js";
import { calculateDistanceAndAngle, getPoints } from "./helper/point.js";
import { straightNode } from "./node/straightNode.js";
import { curveNode } from "./node/curveNode.js";
import { TIntersectNode } from "./node/TIntersectNode.js";
import { IntersectNode } from "./node/intersectNode.js";
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
    this.roadsMesh = {};
    this.roadGrids = [];
    this.setupLights({ width, length });
    this.setUpPlatform({ width, length });
    this.buildingsToGrow = [];
    this.hoverObjects = [];
    this.previewModel = null;
    this.vehicles = [];
  }

  async init() {
    // this.previewModel = await Vehicle.create({
    //   x: 0,
    //   y: 0,
    // });
    // this.scene.add(this.previewModel.mesh);
  }

  async setUpPlatform({ width, length }) {
    for (let x = 0; x < width; x++) {
      this.roadGrids[x] = [];
      for (let y = 0; y < length; y++) {
        let x_pos = x - Math.floor(width / 2);
        let y_pos = y - Math.floor(length / 2);
        const grass = new Grass({ x: x_pos, y: y_pos });

        this.roadGrids[x][y] = [" ", ["", "", "", ""]];
        this.scene.add(grass.mesh);
      }
    }
    const vehicle = await Vehicle.create({
      position: { x: 0, y: 0 },
    });

    // this.vehicles.push(vehicle);
    const printNodeAndChildren = ({ color = "White", node }) => {
      const colors = {
        Red: "#FF0000",
        Green: "#00FF00",
        White: "#FFFFFF",
      };
      if (node.isEndNode()) {
        color = "Red";
      }
      // Recursively print the children nodes
      const { location: nodeLocation } = node;

      const point = Geometry.point({
        position: nodeLocation,
        color: colors[color],
      });
      this.scene.add(point);
      node.children.forEach((child) => {
        if (!child) return;
        const { location: childLocation } = child;
        const { length, angle } = calculateDistanceAndAngle({
          location1: nodeLocation,
          location2: childLocation,
        });

        this.scene.add(
          Geometry.arrow({
            position: nodeLocation,
            yRotation: -angle,
            length,
            color: colors[color],
          })
        );
        this.scene.remove(point);
        printNodeAndChildren({ node: child });
      });
      return node;
    };
    const straightTop = straightNode({
      isIntersect: true,
      isVertical: true,
      location: { x: 1, y: -2 },
    });
    const straightBottom = straightNode({
      isIntersect: true,
      isVertical: true,
      location: { x: 1, y: 0 },
    });
    const straightLeft = straightNode({
      isIntersect: true,
      isVertical: false,
      location: { x: 0, y: -1 },
    });
    const straightRight = straightNode({
      isIntersect: true,
      isVertical: false,
      location: { x: 2, y: -1 },
    });
    const TIntersect = TIntersectNode({
      angle: 0,
      location: { x: 1, y: -4 },
    });
    const Intersect = IntersectNode({
      location: { x: 1, y: -1 },
    });

    const testStraightLeft = straightNode({
      isIntersect: false,
      isVertical: false,
      location: { x: 0, y: -4 },
    });
    const testStraightRight = straightNode({
      isIntersect: false,
      isVertical: false,
      location: { x: 2, y: -4 },
    });
    const testStraightBottom = straightNode({
      isIntersect: false,
      isVertical: true,
      location: { x: 1, y: -3 },
    });
    const testStraightTop = straightNode({
      isIntersect: false,
      isVertical: true,
      location: { x: 1, y: -5 },
    });

    const joinNodes = (n1, n2, direction) => {
      if (direction === "Right" && n2.left && n1.right) {
        n2.left[0].connectToRootNode(n1.right[0]);
        n2.left[1].connectToRootNode(n1.right[1]);
        n1.right[2].connectToEndNode(n2.left[2]);
        n1.right[3].connectToEndNode(n2.left[3]);
      } else if (direction === "Left" && n1.left && n2.right) {
        n1.left[0].connectToRootNode(n2.right[0]);
        n1.left[1].connectToRootNode(n2.right[1]);
        n2.right[2].connectToEndNode(n1.left[2]);
        n2.right[3].connectToEndNode(n1.left[3]);
      } else if (direction === "Bottom" && n1.bottom && n2.top) {
        n1.bottom[0].connectToRootNode(n2.top[0]);
        n1.bottom[1].connectToRootNode(n2.top[1]);
        n2.top[2].connectToEndNode(n1.bottom[2]);
        n2.top[3].connectToEndNode(n1.bottom[3]);
      } else if (direction === "Top" && n2.bottom && n1.top) {
        n2.bottom[0].connectToRootNode(n1.top[0]);
        n2.bottom[1].connectToRootNode(n1.top[1]);
        n1.top[2].connectToEndNode(n2.bottom[2]);
        n1.top[3].connectToEndNode(n2.bottom[3]);
      }
    };
    const roadCordinateNodes = {};
    const setRCN = (node) => {
      roadCordinateNodes[`${node.location.x}${node.location.y}`] = node;
    };
    setRCN(testStraightRight);
    setRCN(testStraightLeft);
    setRCN(testStraightBottom);
    setRCN(testStraightTop);
    setRCN(TIntersect);
    setRCN(straightTop);
    setRCN(straightBottom);
    setRCN(straightLeft);
    setRCN(straightRight);
    setRCN(Intersect);

    const joinNodesGrid = () => {
      let roots = [];
      Object.entries(roadCordinateNodes).map(([, value]) => {
        const { x, y } = value.location;
        const top = roadCordinateNodes[`${x}${y - 1}`];
        const right = roadCordinateNodes[`${x + 1}${y}`];
        const bottom = roadCordinateNodes[`${x}${y + 1}`];
        const left = roadCordinateNodes[`${x - 1}${y}`];
        if (left && !left.isJoinRight && !value.isJoinLeft) {
          left.isJoinRight = true;
          value.isJoinLeft = true;
          joinNodes(value, left, "Left");
        } else if (right && !right?.isJoinLeft && !value?.isJoinRight) {
          right.isJoinLeft = true;
          value.isJoinRight = true;
          joinNodes(value, right, "Right");
        } else if (top && !top.isJoinBottom && !value.isJoinTop) {
          top.isJoinBottom = true;
          value.isJoinTop = true;
          joinNodes(value, top, "Top");
        } else if (bottom && !bottom.isJoinTop && !value.isJoinBottom) {
          bottom.isJoinTop = true;
          value.isJoinBottom = true;
          joinNodes(value, bottom, "Bottom");
        }
        roots.push(...value.roots);
      });
      return roots.filter((n) => n.isParent);
    };
    const points = joinNodesGrid();
    const path = points[0].getRandomPath();
    printNodeAndChildren({ color: "Green", node: path });
    const aStar = (startNode, endNode) => {
      const openSet = new Set([startNode]);
      const cameFrom = new Map();
      const gScore = new Map();
      const fScore = new Map();

      gScore.set(startNode, 0);
      fScore.set(startNode, startNode.distanceTo(endNode));

      while (openSet.size > 0) {
        // Find the node in openSet with the lowest fScore
        let current = [...openSet].reduce(
          (min, node) => (fScore.get(node) < fScore.get(min) ? node : min),
          [...openSet][0]
        );

        if (current === endNode) {
          // Reconstruct the path
          const path = [];
          while (cameFrom.has(current)) {
            path.push(current);
            current = cameFrom.get(current);
          }
          path.push(startNode);
          return path.reverse(); // Return the path from start to end
        }

        openSet.delete(current);

        for (const neighbor of current.getNeighbors()) {
          const tentativeGScore =
            gScore.get(current) + current.distanceTo(neighbor);

          if (!gScore.has(neighbor) || tentativeGScore < gScore.get(neighbor)) {
            cameFrom.set(neighbor, current);
            gScore.set(neighbor, tentativeGScore);
            fScore.set(
              neighbor,
              tentativeGScore + neighbor.distanceTo(endNode)
            );

            if (!openSet.has(neighbor)) {
              openSet.add(neighbor);
            }
          }
        }
      }

      return []; // Return an empty path if no path was found
    };
    // aStar(points[0], endPoint).forEach((node) => {
    //   printNodeAndChildren({ color: "Green", node });
    // });
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
    this.vehicles.forEach((vc) => vc.move());
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

  handleRoadGrid() {
    if (this.hoverObjects.length === 0) return;
    let { position, name, parent } = this.hoverObjects[0].object;
    if (name !== "Grass") {
      position = parent.parent.position;
    }
    let col = position.x + Math.floor(this.s_length / 2);
    let row = position.z + Math.floor(this.s_width / 2);
    handleAddRoadToGrid({
      type: this.selectRoad,
      col,
      row,
      roadGrids: this.roadGrids,
      position,
      addRoadMesh: async (params) => await this.addRoadMesh(params),
      findMesh: (params) => this.findMesh(params),
      deleteMesh: (params) => this.deleteMesh(params),
      addGrass: () => {
        const grass = new Grass({ x: position.x, y: position.z });
        this.scene.add(grass.mesh);
      },
    });
    printGrid(this.roadGrids);
  }

  async addRoadMesh({ position, name, modelUrl, rotation }) {
    const newRoad = await Road.create({
      position,
      name,
      modelUrl,
    });
    newRoad.setRotate(rotation);
    this.scene.add(newRoad.mesh);
  }

  findMesh({ position, notInCludeName }) {
    const { x, z } = position;
    let foundMesh = null;
    this.scene.children.forEach((object) => {
      if (
        !notInCludeName.includes(object.name) &&
        object.position.x === x &&
        object.position.z === z
      ) {
        foundMesh = object;
      }
    });
    return foundMesh;
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

  onSelectObject() {
    if (this.hoverObjects.length > 0) {
      this.handleRoadGrid();
    }
  }

  onHoverObject(e) {
    this.updateMousePosition(e);
    const intersections = this.getIntersections();

    if (intersections.length > 0) {
      if (this.hoverObjects.length) {
        this.hoverObjects.forEach((c) =>
          c?.object?.material?.emissive?.setHex(0)
        );
      }
      const corner = intersections[0].object;
      // this.hoverObjects = this.getChildrenInGrid(corner.position, Road.base);
      this.hoverObjects = intersections;
      // const { x, z } = corner.position;
      // this.previewModel.updatePosition({ x, z });
      // const colisions = this.buildings.filter((building) =>
      //   this.previewModel.isColision(building)
      // );
      // this.previewModel.setIsCollision(colisions.length > 0);

      this.hoverObjects.forEach((c) => {
        c.object.material.emissive.setHex(0x555555);
      });
      // const intersectedObject = intersections[0].object; // The closest intersected object
    } else {
      if (this.hoverObjects.length > 0) {
        this.hoverObjects.forEach((c) => {
          c.object.material.emissive.setHex(0);
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
    this.raycaster.setFromCamera(
      { x: this.mouse.x, y: this.mouse.y },
      this.camera
    );
    return this.raycaster.intersectObjects(this.scene.children, true);
  }
}
