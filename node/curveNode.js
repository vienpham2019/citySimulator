import { getPoints } from "../helper/point.js";
import { Node } from "./node.js";

const curveNode = ({ angle = 90, position, rootNodes = [], endNodes = [] }) => {
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
      a: { x: 0.32, y: 0 },
      b: { x: 0, y: -0.1 },
      angle,
      deviceTo: 4,
    },
    {
      a: { x: 0.44, y: 0 },
      b: { x: 0, y: -0.11 },
      angle,
      deviceTo: 5,
    },
    {
      a: { x: 0.54, y: 0 },
      b: { x: 0, y: 0.1 },
      angle,
      deviceTo: 5,
      direction: -1,
    },
    {
      a: { x: 0.65, y: 0 },
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
        position: {
          x: parseFloat(x + position.x + offset.x).toFixed(2),
          y: parseFloat(y + position.y + offset.y).toFixed(2),
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

  const [c1, c2, c3, c4] = result;
  if (angle === 270) {
    return {
      position,
      left: [c4.endNode, c3.endNode, c2, c1],
      bottom: [c1.endNode, c2.endNode, c3, c4],
      roots: result,
    };
  } else if (angle === 180) {
    return {
      position,
      right: [c4, c3, c2.endNode, c1.endNode],
      bottom: [c4.endNode, c3.endNode, c2, c1],
      roots: result,
    };
  } else if (angle === 90) {
    return {
      position,
      right: [c1, c2, c3.endNode, c4.endNode],
      top: [c4, c3, c2.endNode, c1.endNode],
      roots: result,
    };
  } else {
    return {
      position,
      left: [c1.endNode, c2.endNode, c3, c4],
      top: [c1, c2, c3.endNode, c4.endNode],
      roots: result,
    };
  }
};

export { curveNode };
