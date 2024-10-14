import { OrbitControls } from "jsm/controls/OrbitControls.js";
import Scene from "./sence.js";
(function () {
  var script = document.createElement("script");
  script.onload = function () {
    var stats = new Stats();
    document.body.appendChild(stats.dom);
    requestAnimationFrame(function loop() {
      stats.update();
      requestAnimationFrame(loop);
    });
  };
  script.src = "https://mrdoob.github.io/stats.js/build/stats.min.js";
  document.head.appendChild(script);
})();
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

function debounce(func, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}

document.body.addEventListener(
  "mousemove",
  debounce((event) => {
    myScene.onHoverObject(event);
  }, 1),
  false
);

document.body.addEventListener(
  "keydown",
  (event) => {
    if (event.key === "r" || event.key === "R") {
      myScene.previewModel.rotate({ y: 90 });
    }
    if (event.key === "1") {
      myScene.selectRoad = "Main";
    }
    if (event.key === "2") {
      myScene.selectRoad = "Normal";
    }
  },
  false
);
