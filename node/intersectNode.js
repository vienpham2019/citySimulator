import { curveNode } from "./curveNode.js";
import { straightNode } from "./straightNode.js";

const IntersectNode = ({ location }) => {
  let [v1, v2, v3, v4] = straightNode({
    isVertical: true,
    isIntersect: false,
    location,
  }).roots;
  let [h1, h2, h3, h4] = straightNode({
    isVertical: false,
    isIntersect: false,
    location,
  }).roots;
  curveNode({
    angle: 360,
    location,
    rootNodes: [v1, v2, h3, h4],
    endNodes: [h1.endNode, h2.endNode, v3.endNode, v4.endNode],
  });
  curveNode({
    angle: 90,
    location,
    rootNodes: [h4, h3, v3, v4],
    endNodes: [v1.endNode, v2.endNode, h2.endNode, h1.endNode],
  });
  curveNode({
    angle: 180,
    location,
    rootNodes: [v4, v3, h2, h1],
    endNodes: [h4.endNode, h3.endNode, v2.endNode, v1.endNode],
  });
  curveNode({
    angle: 270,
    location,
    rootNodes: [h1, h2, v2, v1],
    endNodes: [v4.endNode, v3.endNode, h3.endNode, h4.endNode],
  });

  return {
    location,
    top: [v1, v2, v3.endNode, v4.endNode],
    right: [h1, h2, h3.endNode, h4.endNode],
    bottom: [v1.endNode, v2.endNode, v3, v4],
    left: [h1.endNode, h2.endNode, h3, h4],
    roots: [h1, h2, h3, h4, v1, v2, v3, v4],
  };
};

export { IntersectNode };
