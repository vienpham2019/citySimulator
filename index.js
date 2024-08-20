import { OrbitControls } from "jsm/controls/OrbitControls.js";
import Scene from "./sence.js";
import IndustryFactory from "./buildings/IndustryFactory.js";

const width = 20;
const length = 20;
const myScene = new Scene({ width, length });
myScene.init();
new OrbitControls(myScene.camera, myScene.renderer.domElement);

window.onload = () => {
  myScene.start();
};

document.body.addEventListener(
  "mousedown",
  (event) => {
    // Left mouse
    if (event.button === 0) myScene.onSelectObject(event);
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

document.body.addEventListener(
  "keydown",
  (event) => {
    if (event.key === "r" || event.key === "R") {
      myScene.previewModel.rotate({ y: 90 });
    }
  },
  false
);
