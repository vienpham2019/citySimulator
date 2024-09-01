import { getPoints } from "../helper/point.js";
import { Node } from "./node.js";

const curveNode = ({ angle = 90, location, rootNodes = [], endNodes = [] }) => {
  let result = [];
  const offset = { x: -1, y: 1 };
  if (angle === 90) {
    angle = 270;
  } else if (angle === 180) {
    offset.x = 0;
    angle = 180;
  } else if (angle === 270) {
    offset.x = 0;
    offset.y = 0;
    angle = 90;
  } else if (angle === 360) {
    offset.y = 0;
    angle = 0;
  }
  const arrPoints = [
    {
      a: { x: 0.34, y: 0 },
      b: { x: 0, y: -0.1 },
      angle,
      deviceTo: 4,
    },
    {
      a: { x: 0.45, y: 0 },
      b: { x: 0, y: -0.11 },
      angle,
      deviceTo: 5,
    },
    {
      a: { x: 0.55, y: 0 },
      b: { x: 0, y: 0.1 },
      angle,
      deviceTo: 5,
      direction: -1,
    },
    {
      a: { x: 0.66, y: 0 },
      b: { x: 0, y: 0.1 },
      angle,
      deviceTo: 5,
      direction: -1,
    },
  ];

  arrPoints.forEach((p, i) => {
    let rootNode = null;
    let currentNode = null;
    const points = getPoints(p);
    points.map(({ x, y }, p_i) => {
      let newNode = new Node({
        location: {
          x: parseFloat(x + location.x + offset.x).toFixed(2),
          y: parseFloat(y + location.y + offset.y).toFixed(2),
        },
      });
      if (rootNode === null) {
        rootNode = rootNodes[i] || newNode;
        currentNode = rootNode;
      } else {
        if (p_i === points.length - 1) {
          if (endNodes[i]) newNode = endNodes[i];
          if (rootNode.endNode === null) rootNode.setEndNode(newNode);
        }
        currentNode.addChild(newNode);
        currentNode = newNode;
      }
    });

    result.push(rootNode);
  });

  return result;
};

export { curveNode };
