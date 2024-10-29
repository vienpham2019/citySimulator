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

function findGapsAfterTaking(gaps, takenNumber) {
  const updatedGaps = [];
  let numberTaken = false;

  for (const [start, end] of gaps) {
    // If the taken number is less than the start of the current gap
    if (takenNumber < start) {
      // If the number hasn't been added yet, add it as a gap
      if (!numberTaken) {
        updatedGaps.push([takenNumber, takenNumber]);
        numberTaken = true; // Mark that we've added the taken number
      }
      updatedGaps.push([start, end]); // Push the current gap
    }
    // If the taken number is within the current gap
    else if (takenNumber >= start && takenNumber <= end) {
      // If the taken number is greater than the start, we add the left side gap
      if (takenNumber > start) {
        updatedGaps.push([start, takenNumber - 1]);
      }
      // Add a gap after the taken number if there's space
      if (takenNumber < end) {
        updatedGaps.push([takenNumber + 1, end]);
      }
      numberTaken = true; // Mark that we've processed the taken number
    }
    // If the taken number is greater than the end of the current gap
    else {
      updatedGaps.push([start, end]); // Just push the current gap
    }
  }

  // If the taken number hasn't been added yet, add it at the end
  if (!numberTaken) {
    updatedGaps.push([takenNumber, takenNumber]);
  }

  return updatedGaps;
}

function addBackNumber(gaps, numberToAdd) {
  const updatedGaps = [];
  let numberAdded = false;

  for (let i = 0; i < gaps.length; i++) {
    const [start, end] = gaps[i];

    if (numberToAdd < start - 1) {
      // If the number is before this gap and no merge is needed, add it as a new gap
      if (!numberAdded) {
        updatedGaps.push([numberToAdd, numberToAdd]);
        numberAdded = true;
      }
      updatedGaps.push([start, end]);
    } else if (numberToAdd === start - 1) {
      // If the number directly extends the start of this gap, merge it
      updatedGaps.push([numberToAdd, end]);
      numberAdded = true;
    } else if (numberToAdd >= start && numberToAdd <= end) {
      // If the number is already within this gap, no need to add it
      updatedGaps.push([start, end]);
      numberAdded = true;
    } else if (numberToAdd === end + 1) {
      // If the number extends the end of this gap, merge it with this gap
      updatedGaps.push([start, numberToAdd]);
      numberAdded = true;
    } else {
      // Otherwise, just add the current gap
      updatedGaps.push([start, end]);
    }
  }

  // If the number is beyond the last gap and hasn't been added, add it as a new gap
  if (!numberAdded) {
    updatedGaps.push([numberToAdd, numberToAdd]);
  }

  // Now merge any overlapping or adjacent gaps
  const mergedGaps = [];
  let [currentStart, currentEnd] = updatedGaps[0];

  for (let i = 1; i < updatedGaps.length; i++) {
    const [nextStart, nextEnd] = updatedGaps[i];

    if (currentEnd + 1 >= nextStart) {
      // Merge overlapping or adjacent gaps
      currentEnd = Math.max(currentEnd, nextEnd);
    } else {
      // Add the current gap and start a new one
      mergedGaps.push([currentStart, currentEnd]);
      currentStart = nextStart;
      currentEnd = nextEnd;
    }
  }
  mergedGaps.push([currentStart, currentEnd]);

  return mergedGaps;
}
let gaps = [
  [0, 17],
  [19, 19],
  [21, 100],
];
let takenNumber = 17;

let updatedGaps = addBackNumber(gaps, takenNumber);
console.log("Updated Gaps:", updatedGaps); // Output: [[0, 9], [11, 19], [21, 100]]
