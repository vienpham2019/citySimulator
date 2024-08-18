import { OrbitControls } from "jsm/controls/OrbitControls.js";
import Scene from "./sence.js";
import Grass from "./Grass.js";
import Building from "./Building.js";

const width = 20;
const length = 20;
const myScene = new Scene({ width, length });

new OrbitControls(myScene.camera, myScene.renderer.domElement);

window.onload = () => {
  myScene.start();
};

document.body.addEventListener(
  "mousedown",
  (event) => {
    myScene.onSelectObject(event);
  },
  false
);

document.body.addEventListener(
  "mousemove",
  (event) => {
    myScene.onHoverObject(event);
  },
  false
);
