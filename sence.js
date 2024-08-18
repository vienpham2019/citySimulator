import * as THREE from "three";
import Building from "./Building.js";
import Grass from "./Grass.js";
const w = window.innerWidth;
const h = window.innerHeight;

export default class Scene {
  constructor({ width = 10, length = 10 }) {
    // Initialize scene, camera, and renderer
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
    this.setupLights({ width, length });
    this.setUpPlatform({ width, length });
    this.buildingsToGrow = [];
    this.hoverObject = null;
  }

  setUpPlatform({ width, length }) {
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < length; y++) {
        let x_pos = x - Math.floor(width / 2);
        let y_pos = y - Math.floor(length / 2);
        const grass = new Grass({ x: x_pos, y: y_pos });
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
  }

  draw = () => {
    this.renderer.render(this.scene, this.camera);
    for (let i = this.buildingsToGrow.length - 1; i >= 0; i--) {
      const building = this.buildingsToGrow[i];

      if (building.height < building.maxHeight) {
        building.grow(); // Continue growing if not yet at max height
      } else {
        // Remove the building from the scene and the array
        this.buildingsToGrow.splice(i, 1); // Remove from the array
      }
    }
  };

  start() {
    this.renderer.setAnimationLoop(this.draw);
  }

  stop() {
    this.renderer.setAnimationLoop(null);
  }

  handleAddObject({ x, y }) {
    const buildingHeight = Math.floor(Math.random() * 5) + 1;
    const building = new Building({
      x,
      y,
      maxHeight: buildingHeight,
    });
    this.scene.add(building.mesh);
    this.buildingsToGrow.push(building);
  }

  onSelectObject(e) {
    this.updateMousePosition(e);
    const intersections = this.getIntersections();

    if (intersections.length > 0) {
      this.selectedObject = intersections[0].object;

      const { x, z } = this.selectedObject.position;
      if (this.selectedObject.name === "Grass") {
        this.handleAddObject({ x, y: z });
      }
    }
  }

  onHoverObject(e) {
    this.updateMousePosition(e);
    const intersections = this.getIntersections();

    if (intersections.length > 0) {
      if (this.hoverObject) {
        this.hoverObject.material.emissive.setHex(0);
      }

      this.hoverObject = intersections[0].object;
      this.hoverObject.material.emissive.setHex(0x555555);
    } else {
      if (this.hoverObject) {
        this.hoverObject.material.emissive.setHex(0);
        this.hoverObject = null;
      }
    }
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
