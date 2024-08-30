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
import { getPoints } from "./helper/point.js";
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

    const points = [...IntersectNode({ location: { x: 0, y: -1 } })];
    points.forEach(({ x, y, length, yRotation }) => {
      this.scene.add(
        Geometry.arrow({
          position: { x, y: 0, z: y },
          yRotation,
          length,
        })
      );
    });
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
        this.hoverObjects.forEach((c) => c.object.material.emissive.setHex(0));
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
