import { OrbitControls } from "jsm/controls/OrbitControls.js";
import Scene from "./sence.js";
import Grass from "./Grass.js";
import Building from "./Building.js";

const width = 20;
const length = 20;
const myScene = new Scene({ width });
const buildings = [];
for (let x = 0; x < width; x++) {
  for (let y = 0; y < length; y++) {
    let x_pos = x - Math.floor(width / 2);
    let y_pos = y - Math.floor(length / 2);
    const grass = new Grass({ x: x_pos, y: y_pos });
    myScene.scene.add(grass.mesh);

    if (Math.random() > 0.8) {
      const buildingHeight = Math.floor(Math.random() * 5) + 1;
      const building = new Building({
        x: x_pos,
        y: y_pos,
        maxHeight: buildingHeight,
      });
      myScene.scene.add(building.mesh);
      buildings.push(building);
    }
  }
}

new OrbitControls(myScene.camera, myScene.renderer.domElement);

window.onload = () => {
  myScene.start(buildings);
};
