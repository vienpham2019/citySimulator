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
    this.nodes = [];
    this.setupLights({ width, length });
    this.setUpPlatform({ width, length });
    this.buildingsToGrow = [];
    this.hoverObjects = [];
    this.previewModel = null;
    this.vehicles = [];
    this.deleteVehicleIds = [];
  }

  async init() {
    // this.previewModel = await Vehicle.create({
    //   x: 0,
    //   y: 0,
    // });
    // this.scene.add(this.previewModel.mesh);
  }

  printNodeAndChildren = ({ color = "White", node, vehicleId }) => {
    const colors = {
      Red: "#FF0000",
      Green: "#00FF00",
      White: "#FFFFFF",
    };
    if (node.isEndNode()) {
      color = "Red";
    }
    // Recursively print the children nodes
    const { position: nodeposition } = node;

    const point = Geometry.point({
      position: nodeposition,
      color: colors[color],
      name: vehicleId,
    });
    this.scene.add(point);
    node.children.forEach((child) => {
      if (!child) return;
      const { position: childposition } = child;
      const { length, angle } = calculateDistanceAndAngle({
        position1: nodeposition,
        position2: childposition,
      });

      this.scene.add(
        Geometry.arrow({
          position: nodeposition,
          yRotation: -angle,
          length,
          color: colors[color],
          name: vehicleId,
        })
      );
      this.scene.remove(point);
      this.printNodeAndChildren({ node: child, vehicleId });
    });
    return node;
  };

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

    const straightTop = straightNode({
      isIntersect: true,
      isVertical: true,
      position: { x: 1, y: -2 },
    });
    const straightBottom = straightNode({
      isIntersect: true,
      isVertical: true,
      position: { x: 1, y: 0 },
    });
    const straightLeft = straightNode({
      isIntersect: true,
      isVertical: false,
      position: { x: 0, y: -1 },
    });
    const straightRight = straightNode({
      isIntersect: true,
      isVertical: false,
      position: { x: 2, y: -1 },
    });
    const TIntersect = TIntersectNode({
      angle: 0,
      position: { x: 1, y: -4 },
    });
    const Intersect = IntersectNode({
      position: { x: 1, y: -1 },
    });

    const testStraightLeft = straightNode({
      isIntersect: false,
      isVertical: false,
      position: { x: 0, y: -4 },
    });
    const testStraightRight = straightNode({
      isIntersect: false,
      isVertical: false,
      position: { x: 2, y: -4 },
    });
    const testStraightBottom = straightNode({
      isIntersect: false,
      isVertical: true,
      position: { x: 1, y: -3 },
    });
    const testStraightTop = straightNode({
      isIntersect: false,
      isVertical: true,
      position: { x: 1, y: -5 },
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
      roadCordinateNodes[`${node.position.x}${node.position.y}`] = node;
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
        const { x, y } = value.position;
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
    this.nodes = joinNodesGrid();
    this.addVehicle();
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

  addVehicle = async () => {
    if (this.nodes.length === 0) return;
    const index = Math.floor(Math.random() * this.nodes.length);
    const path = this.nodes[index].getRandomPath();
    const vehicle = await Vehicle.create({
      node: path,
    });
    this.printNodeAndChildren({
      color: "Green",
      node: path,
      vehicleId: vehicle.id,
    });
    this.scene.add(vehicle.mesh);
    this.vehicles.push(vehicle);
  };

  draw = () => {
    if (this.deleteVehicleIds.length > 0) {
      this.deleteMeshesByName(this.deleteVehicleIds);
    }

    this.vehicles.forEach((vc) => {
      if (vc.isArrived) {
        this.deleteMesh(vc.mesh);
        this.deleteVehicleIds.push(vc.id);
        this.vehicles = this.vehicles.filter((v) => v.id !== vc.id);
        this.addVehicle();
      } else {
        vc.move();
      }
    });
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

  deleteMeshesByName(names) {
    // Loop through all children in the scene
    let isDelete = false;
    this.scene.children.forEach((child) => {
      // Check if the child is a mesh and its name matches one of the names to delete
      if (child.isMesh && names.includes(child.name)) {
        isDelete = true;
        this.deleteMesh(child);
      }
    });
    if (!isDelete) {
      this.deleteVehicleIds.filter((id) => !names.includes(id));
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
