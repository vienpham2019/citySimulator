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
new OrbitControls(myScene.camera, myScene.renderer.domElement);
function debounce(func, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}
window.onload = async () => {
  await myScene.init({ width, length });
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

const points = [
  { x: -2, y: -2.16 },
  { x: -2.5, y: -2.16 },
  { x: -2, y: -2.05 },
  { x: -2.5, y: -2.05 },
  { x: -2, y: -2.05 },
  { x: -2, y: -2.16 },
  { x: -2, y: -1.95 },
  { x: -1.5, y: -1.95 },
  { x: -2, y: -1.84 },
  { x: -1.5, y: -1.84 },
  { x: -2, y: -1.84 },
  { x: -2, y: -1.95 },
];

for (let i = 0; i < points.length - 1; i++) {
  const current = points[i];
  const next = points[i + 1];

  // Check if x or y values are equal and difference is less than 0.5
  if (Math.abs(current.x + current.y - (next.x + next.y)) < 0.2) {
    console.log(`Match found between points ${i} and ${i + 1}:`, current, next);
  }
}
