import * as THREE from "three";

import Grass from "./GLTFModel/Grass.js";
import IndustryFactory from "./GLTFModel/IndustryFactory.js";
import {
  converMeshRotationToDegrees,
  handleAddRoadToGrid,
  printGrid,
} from "./helper/road.js";
import Road from "./GLTFModel/Road.js";
import Vehicle from "./GLTFModel/Vehicle.js";
import Geometry from "./Geometry.js";
import { calculateDistanceAndAngle, getPoints } from "./helper/point.js";
import { straightNode } from "./node/straightNode.js";
import { curveNode } from "./node/curveNode.js";
import { TIntersectNode } from "./node/TIntersectNode.js";
import { IntersectNode } from "./node/intersectNode.js";
import {
  createArrowInstanceMesh,
  createGrassInstanceMesh,
  createPointInstanceMesh,
  createVehicleInstanceMesh,
  setArrowPosition,
  setInstanceMeshObjPosition,
  setPointPosition,
} from "./helper/instanceMesh.js";
import { getRectVertices, verticalVertices } from "./helper/vertice.js";
import { getLineIntersection } from "./helper/intersection.js";
import GLTF from "./GLTFModel/GLTF.js";
import TrafficLight from "./GLTFModel/TrafficLight.js";
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
    this.trafficLight = null;
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

  printNodeAndChildren = ({ node, vehicleId, processedNodes }) => {
    const { position: nodeposition } = node;
    if (!node) {
      return; // Skip processing if node is already processed
    }
    if (
      node.isEndNode() &&
      !processedNodes.has(`End:${nodeposition.x},${nodeposition.y}`)
    ) {
      setPointPosition({
        position: nodeposition,
        index: this.endPointIndex++,
        instanceMesh: this.endPointInstancedMesh,
      });

      processedNodes.add(`End:${nodeposition.x},${nodeposition.y}`);
    }
    if (
      node.isRootNode() &&
      !processedNodes.has(`Root:${nodeposition.x},${nodeposition.y}`)
    ) {
      setPointPosition({
        position: nodeposition,
        index: this.startPointIndex++,
        instanceMesh: this.startPointInstancedMesh,
      });

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
      const { length, angleDeg } = calculateDistanceAndAngle({
        position1: nodeposition,
        position2: childposition,
      });
      // Point
      if (!child.isEndNode()) {
        setPointPosition({
          position: childposition,
          index: this.pointIndex++,
          instanceMesh: this.pointInstancedMesh,
        });
      }
      // Arrow
      setArrowPosition({
        position: childposition,
        index: this.arrowIndex++,
        instanceMesh: this.arrowInstancedMesh,
        angleDeg,
        length,
      });
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

  drawLine(p1, p2, color = 0xff0000) {
    const points = [
      new THREE.Vector3(p1.x, 0.02, p1.y),
      new THREE.Vector3(p2.x, 0.02, p2.y),
    ];

    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    // 2. Create a material for the line
    const material = new THREE.LineBasicMaterial({ color }); // Red line

    // 3. Create the line object
    const line = new THREE.Line(geometry, material);

    // 4. Add the line to the scene
    this.scene.add(line);
    return line;
  }

  drawRect(vertices, color = 0xff0000) {
    return [
      this.drawLine(vertices.TopRight, vertices.TopLeft, color),
      this.drawLine(vertices.TopRight, vertices.BottomRight, color),
      this.drawLine(vertices.BottomLeft, vertices.BottomRight, 0xff00ff),
      this.drawLine(vertices.TopLeft, vertices.BottomLeft, color),
    ];
  }

  async setUpPlatform({ width, length }) {
    const grass = await Grass.create({ maxInstance: width * length });
    this.grass = grass;
    this.scene.add(grass.instanceMesh);
    this.scene.add(
      Geometry.box({
        height: 0.1,
        width,
        length,
        color: 0x654321,
        position: {
          x: -0.5,
          y: -0.25,
          z: -0.5,
        },
      })
    );
    for (let x = 0; x < width; x++) {
      this.roadGrids[x] = [];
      for (let y = 0; y < length; y++) {
        let x_pos = x - Math.floor(width / 2);
        let y_pos = y - Math.floor(length / 2);
        this.grass.updateInstanceMeshPosition({
          position: { x: x_pos, y: y_pos },
          index: x * length + y,
        });

        this.roadGrids[x][y] = [" ", ["", "", "", ""]];
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

    // Add the InstancedMesh to the scene
    const { instanceMesh: pointInstancedMesh, index: pointIndex } =
      createPointInstanceMesh({ maxCount: 1000 });
    this.pointIndex = pointIndex;
    this.pointInstancedMesh = pointInstancedMesh;
    this.scene.add(pointInstancedMesh);

    const { instanceMesh: endPointInstancedMesh, index: endPointIndex } =
      createPointInstanceMesh({ color: 0xff0000 });
    this.endPointIndex = endPointIndex;
    this.endPointInstancedMesh = endPointInstancedMesh;
    this.scene.add(endPointInstancedMesh);

    const { instanceMesh: startPointInstancedMesh, index: startPointIndex } =
      createPointInstanceMesh({ color: 0x00ff00 });
    this.startPointIndex = startPointIndex;
    this.startPointInstancedMesh = startPointInstancedMesh;
    this.scene.add(startPointInstancedMesh);

    const { instanceMesh: arrowInstancedMesh, index: arrowIndex } =
      createArrowInstanceMesh({ maxCount: 1000 });
    this.arrowIndex = arrowIndex;
    this.arrowInstancedMesh = arrowInstancedMesh;
    this.scene.add(arrowInstancedMesh);

    const processedNodes = new Set();
    this.nodes.forEach((n) => {
      this.printNodeAndChildren({
        color: "Green",
        node: n,
        vehicleId: "vehicle.id",
        processedNodes,
      });
    });

    let paths = [];
    Array.from({ length: 10 }).forEach((_, i) => {
      // const index = Math.floor(Math.random() * this.nodes.length);
      paths.push(this.nodes[i].getRandomPath());
    });
    const vehicle = await Vehicle.create({ maxInstance: 10, paths });
    this.vehicle = vehicle;

    // const drawDot = ({ x, y }, color = 0x808080) => {
    //   const vertices = new Float32Array([x, 0.1, y]); // Dot at (0, 0, 0)
    //   const geometry = new THREE.BufferGeometry();
    //   geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));

    //   // 2. Create a material for the dot (point)
    //   const material = new THREE.PointsMaterial({
    //     color, // Red color
    //     size: 0.05, // Size of the point
    //   });

    //   // 3. Create the Points object
    //   const dot = new THREE.Points(geometry, material);

    //   // 4. Add the dot to the scene
    //   this.scene.add(dot);
    // };

    // Object.keys(vehicle.usedInstanceIndex).forEach((index) => {
    //   console.log(index);
    //   const { hitBox, rays } = vehicle.getInstanceHitBoxAndRay({
    //     index,
    //   });
    //   drawRect(getRectVertices(hitBox))

    //   rays.forEach((ray) => {
    //     const rayVertices = verticalVertices(ray);
    //     drawLine(rayVertices[0], rayVertices[1]);
    //   });
    // });
    const trafficLight = await TrafficLight.create({
      maxInstance: this.s_length * this.s_width * 4,
    });
    trafficLight.createIntersectLight({
      position: { x: 1, y: 0, z: -1 },
      intersectCount: 4,
    });

    const sides = 6;
    const radius = 0.133;
    const rotation = Math.PI / 2;
    const lightsOffset = {
      top: [
        { x: -1.76, y: 8.85, z: 0.251, color: 0xff0000 },
        { x: -1.76, y: 8.5, z: 0.251, color: 0xffff00 },
        { x: -1.76, y: 8.16, z: 0.251, color: 0x00ff00 },
      ],
      bottom: [
        { x: 0, y: 3.85, z: 0.251, color: 0xff0000 },
        { x: 0, y: 3.5, z: 0.251, color: 0xffff00 },
        { x: 0, y: 3.16, z: 0.251, color: 0x00ff00 },
      ],
    };
    for (let key in lightsOffset) {
      lightsOffset[key].forEach(({ x, y, z, color }) => {
        // this.scene.add(
        //   Geometry.nGon({
        //     sides,
        //     radius,
        //     color,
        //     position: { x, y, z },
        //     rotation,
        //   })
        // );
      });
    }
    this.trafficLight = trafficLight;
    this.scene.add(trafficLight.instanceMesh);
    this.scene.add(vehicle.instanceMesh);
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
    // this.scene.add(vehicle.mesh);
    // this.vehicles.push(vehicle);
  };

  relocateLine = (line, newStart, newEnd) => {
    const positions = line.geometry.attributes.position.array;

    // Update first point (newStart)
    positions[0] = newStart.x;
    positions[1] = 0.02;
    positions[2] = newStart.y;

    // Update second point (newEnd)
    positions[3] = newEnd.x;
    positions[4] = 0.02;
    positions[5] = newEnd.y;

    // Notify Three.js that the position attribute has been updated
    line.geometry.attributes.position.needsUpdate = true;
  };

  draw = () => {
    if (this.trafficLight) {
      this.trafficLight.update();
    }
    const hitBoxs = [];
    if (this.vehicle) {
      this.vehicle.move(this.trafficLight);
      if (this.vehicle.getIsAvaliable()) {
        const index = Math.floor(Math.random() * this.nodes.length);
        this.vehicle.addPath(this.nodes[index].getRandomPath());
      }
      // Object.entries(this.vehicle.usedInstanceIndex).forEach(([index]) => {
      //   const { hitBox, rays } = this.vehicle.getInstanceHitBoxAndRay({
      //     index,
      //   });
      //   const lines = this.drawRect(getRectVertices(hitBox));
      //   rays.forEach((ray) => {
      //     const rayVertices = verticalVertices(ray);
      //     lines.push(this.drawLine(rayVertices[0], rayVertices[1]));
      //   });

      //   setTimeout(() => {
      //     lines.forEach((line) => this.deleteMesh(line));
      //   }, 10);
      // });
    }
    // hitBoxs.forEach((lines) => lines.forEach((line) => this.deleteMesh(line)));

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
