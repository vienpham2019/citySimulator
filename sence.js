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
    this.pointInstancedMesh = null;
  }

  async init() {
    // this.previewModel = await Vehicle.create({
    //   x: 0,
    //   y: 0,
    // });
    // this.scene.add(this.previewModel.mesh);
  }

  printNodeAndChildren = ({
    color = "White",
    node,
    vehicleId,
    processedNodes,
  }) => {
    const colors = {
      Red: "#FF0000",
      Green: "#00FF00",
      White: "#FFFFFF",
    };
    const { position: nodeposition } = node;
    if (!node) {
      return; // Skip processing if node is already processed
    }
    if (
      node.isEndNode() &&
      !processedNodes.has(`End:${nodeposition.x},${nodeposition.y}`)
    ) {
      const pointMatrix = new THREE.Matrix4();
      // Example position for an instance
      const position = new THREE.Vector3(nodeposition.x, 0, nodeposition.y);
      pointMatrix.setPosition(position);
      // Set the matrix at a specific index to make that instance visible
      this.endPointInstancedMesh.setMatrixAt(this.endPointIndex++, pointMatrix);

      processedNodes.add(`End:${nodeposition.x},${nodeposition.y}`);
    }
    if (
      node.isRootNode() &&
      !processedNodes.has(`Root:${nodeposition.x},${nodeposition.y}`)
    ) {
      const rootPointMatrix = new THREE.Matrix4();
      // Example position for an instance
      const position = new THREE.Vector3(nodeposition.x, 0, nodeposition.y);
      rootPointMatrix.setPosition(position);
      // Set the matrix at a specific index to make that instance visible
      this.startPointInstancedMesh.setMatrixAt(
        this.startPointIndex++,
        rootPointMatrix
      );
      processedNodes.add(`Root:${nodeposition.x},${nodeposition.y}`);
    }

    node.children.forEach((child) => {
      const { position: childposition } = child;
      if (
        processedNodes.has(
          `${nodeposition.x}->${childposition.x},${nodeposition.y}->${childposition.y}`
        )
      ) {
        return;
      }
      const { length, angle } = calculateDistanceAndAngle({
        position1: nodeposition,
        position2: childposition,
      });
      // Point
      // // Example position for an instance
      const position = new THREE.Vector3(childposition.x, 0, childposition.y);
      if (!child.isEndNode()) {
        const pointMatrix = new THREE.Matrix4();
        pointMatrix.setPosition(position);
        // Set the matrix at a specific index to make that instance visible
        this.pointInstancedMesh.setMatrixAt(this.pointIndex++, pointMatrix);
      }
      // Arrow
      const arrowMatrix = new THREE.Matrix4();
      // Convert angles to radians
      const yRotationAngle = THREE.MathUtils.degToRad(-angle);
      const zRotationAngle = THREE.MathUtils.degToRad(-90);

      // Create quaternions for each rotation
      const yRotation = new THREE.Quaternion();
      const zRotation = new THREE.Quaternion();

      // Set rotations
      yRotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yRotationAngle); // Y-axis rotation
      zRotation.setFromAxisAngle(new THREE.Vector3(0, 0, 1), zRotationAngle); // Z-axis rotation

      // Combine rotations (note: order matters: first apply Y, then Z)
      const combinedRotation = new THREE.Quaternion();
      combinedRotation.multiplyQuaternions(yRotation, zRotation);

      // Set the scale (length adjustment)
      const lengthScale = new THREE.Vector3(1, length - 0.01, 1); // Adjust X-axis to change length

      // Compose the transformation matrix
      arrowMatrix.compose(position, combinedRotation, lengthScale);
      // Apply additional translation (move up by 1 unit)
      const additionalTranslation = new THREE.Matrix4().makeTranslation(
        0,
        -0.5,
        0
      );
      arrowMatrix.multiply(additionalTranslation);
      // Apply the transformation to the instanced mesh
      this.arrowInstancedMesh.setMatrixAt(this.arrowIndex++, arrowMatrix);

      processedNodes.add(
        `${nodeposition.x}->${childposition.x},${nodeposition.y}->${childposition.y}`
      );
      this.printNodeAndChildren({
        node: child,
        vehicleId,
        processedNodes,
      });
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

    const straightLeft1 = straightNode({
      isIntersect: true,
      isVertical: false,
      position: { x: 0, y: -1 },
    });
    const straightLeft2 = straightNode({
      isIntersect: true,
      isVertical: false,
      position: { x: -1, y: -1 },
    });
    const TIntersect1 = TIntersectNode({
      angle: 180,
      position: { x: -2, y: -1 },
    });
    const straightRight = straightNode({
      isIntersect: true,
      isVertical: false,
      position: { x: 2, y: -1 },
    });
    const Intersect1 = IntersectNode({
      position: { x: 1, y: -4 },
    });
    const Intersect2 = IntersectNode({
      position: { x: 1, y: -1 },
    });
    const TIntersect2 = TIntersectNode({
      angle: 180,
      position: { x: -2, y: -4 },
    });

    const testStraightLeft = straightNode({
      isIntersect: true,
      isVertical: false,
      position: { x: 0, y: -4 },
    });
    const testStraightLeft2 = straightNode({
      isIntersect: true,
      isVertical: false,
      position: { x: -1, y: -4 },
    });
    const testStraightRight = straightNode({
      isIntersect: true,
      isVertical: false,
      position: { x: 2, y: -4 },
    });
    const testStraightBottom = straightNode({
      isIntersect: true,
      isVertical: true,
      position: { x: 1, y: -3 },
    });
    const testStraightBottom2 = straightNode({
      isIntersect: true,
      isVertical: true,
      position: { x: -2, y: -3 },
    });
    const testStraightBottom3 = straightNode({
      isIntersect: true,
      isVertical: true,
      position: { x: -2, y: -2 },
    });
    const testStraightTop = straightNode({
      isIntersect: true,
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
    setRCN(testStraightLeft2);
    setRCN(testStraightBottom);
    setRCN(testStraightBottom2);
    setRCN(testStraightBottom3);
    setRCN(testStraightTop);
    setRCN(Intersect1);
    setRCN(TIntersect1);
    setRCN(TIntersect2);
    setRCN(straightTop);
    setRCN(straightBottom);
    setRCN(straightLeft1);
    setRCN(straightLeft2);
    setRCN(straightRight);
    setRCN(Intersect2);

    const joinNodesGrid = () => {
      const roots = new Set();
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
        }
        if (right && !right.isJoinLeft && !value.isJoinRight) {
          right.isJoinLeft = true;
          value.isJoinRight = true;
          joinNodes(value, right, "Right");
        }
        if (top && !top.isJoinBottom && !value.isJoinTop) {
          top.isJoinBottom = true;
          value.isJoinTop = true;
          joinNodes(value, top, "Top");
        }
        if (bottom && !bottom.isJoinTop && !value.isJoinBottom) {
          bottom.isJoinTop = true;
          value.isJoinBottom = true;
          joinNodes(value, bottom, "Bottom");
        }
        value.roots.forEach((root) => roots.add(root));
      });
      return Array.from(roots).filter((n) => n.isParent);
    };
    this.nodes = joinNodesGrid();

    // Create the geometry and material for the points
    const arrow = Geometry.cone({
      position: { x: 0, y: 0, z: 0 },
      color: 0xffffff,
    });

    // Create the InstancedMesh with a capacity of 1000 instances
    this.arrowInstancedMesh = new THREE.InstancedMesh(
      arrow.geometry,
      arrow.material,
      1000 // Maximum number of instances
    );

    // Create the geometry and material for the points
    const point = Geometry.point({
      position: { x: 0, y: 0, z: 0 },
      color: 0xffffff,
    });

    // Create the InstancedMesh with a capacity of 1000 instances
    this.pointInstancedMesh = new THREE.InstancedMesh(
      point.geometry,
      point.material,
      1000 // Maximum number of instances
    );

    // Create the geometry and material for the points
    const endPoint = Geometry.point({
      position: { x: 0, y: 0, z: 0 },
      color: 0xff0000,
    });

    // Create the InstancedMesh with a capacity of 1000 instances
    this.endPointInstancedMesh = new THREE.InstancedMesh(
      endPoint.geometry,
      endPoint.material,
      100 // Maximum number of instances
    );

    // Create the geometry and material for the points
    const startPoint = Geometry.point({
      position: { x: 0, y: 0, z: 0 },
      color: 0x00ff00,
    });

    // Create the InstancedMesh with a capacity of 1000 instances
    this.startPointInstancedMesh = new THREE.InstancedMesh(
      startPoint.geometry,
      startPoint.material,
      1000 // Maximum number of instances
    );

    // Ensure no instances are visible initially
    const matrix = new THREE.Matrix4();
    matrix.setPosition(new THREE.Vector3(1e10, 1e10, 1e10)); // Move out of view

    // Initialize all instances to be out of view or with zero scale
    for (let i = 0; i < this.pointInstancedMesh.count; i++) {
      this.pointInstancedMesh.setMatrixAt(i, matrix);
    }

    for (let i = 0; i < this.endPointInstancedMesh.count; i++) {
      this.endPointInstancedMesh.setMatrixAt(i, matrix);
    }

    for (let i = 0; i < this.startPointInstancedMesh.count; i++) {
      this.startPointInstancedMesh.setMatrixAt(i, matrix);
    }

    // Initialize all instances to be out of view or with zero scale
    for (let i = 0; i < this.arrowInstancedMesh.count; i++) {
      this.arrowInstancedMesh.setMatrixAt(i, matrix);
    }

    // Mark the instanceMatrix as needing an update
    this.pointInstancedMesh.instanceMatrix.needsUpdate = true;
    this.endPointInstancedMesh.instanceMatrix.needsUpdate = true;
    this.startPointInstancedMesh.instanceMatrix.needsUpdate = true;
    this.arrowInstancedMesh.instanceMatrix.needsUpdate = true;

    // Add the InstancedMesh to the scene
    this.pointIndex = 0;
    this.scene.add(this.pointInstancedMesh);

    this.arrowIndex = 0;
    this.scene.add(this.arrowInstancedMesh);

    this.endPointIndex = 0;
    this.scene.add(this.endPointInstancedMesh);

    this.startPointIndex = 0;
    this.scene.add(this.startPointInstancedMesh);

    const processedNodes = new Set();
    this.nodes.forEach((n) => {
      this.printNodeAndChildren({
        color: "Green",
        node: n,
        vehicleId: "vehicle.id",
        processedNodes,
      });
    });

    // Array.from({ length: 10 }).forEach(() => {
    //   this.addVehicle();
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

  addVehicle = async () => {
    if (this.nodes.length === 0) return;
    const index = Math.floor(Math.random() * this.nodes.length);
    const path = this.nodes[index].getRandomPath();
    const vehicle = await Vehicle.create({
      path,
    });
    // this.printNodeAndChildren({
    //   color: "Green",
    //   node: path,
    //   vehicleId: vehicle.id,
    // });
    this.scene.add(vehicle.mesh);
    this.vehicles.push(vehicle);
  };

  draw = () => {
    // if (this.deleteVehicleIds.length > 0) {
    //   this.deleteMeshesByName(this.deleteVehicleIds);
    // }

    this.vehicles.forEach((vc) => {
      if (vc.isArrived) {
        const index = Math.floor(Math.random() * this.nodes.length);
        const path = this.nodes[index].getRandomPath();
        vc.resetPosition(path);
      } else vc.move();
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
