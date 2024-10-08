import { curveNode } from "./curveNode.js";
import { straightNode } from "./straightNode.js";

const IntersectNode = ({ position }) => {
  let [v1, v2, v3, v4] = straightNode({
    isVertical: true,
    isIntersect: false,
    position,
  }).roots;
  let [h1, h2, h3, h4] = straightNode({
    isVertical: false,
    isIntersect: false,
    position,
  }).roots;
  curveNode({
    angle: 360,
    position,
    rootNodes: [v1, v2, h3, h4],
    endNodes: [h1.endNode, h2.endNode, v3.endNode, v4.endNode],
  });
  curveNode({
    angle: 90,
    position,
    rootNodes: [h4, h3, v3, v4],
    endNodes: [v1.endNode, v2.endNode, h2.endNode, h1.endNode],
  });
  curveNode({
    angle: 180,
    position,
    rootNodes: [v4, v3, h2, h1],
    endNodes: [h4.endNode, h3.endNode, v2.endNode, v1.endNode],
  });
  curveNode({
    angle: 270,
    position,
    rootNodes: [h1, h2, v2, v1],
    endNodes: [v4.endNode, v3.endNode, h3.endNode, h4.endNode],
  });

  return {
    position,
    top: [v1, v2, v3.endNode, v4.endNode],
    right: [h1, h2, h3.endNode, h4.endNode],
    bottom: [v1.endNode, v2.endNode, v3, v4],
    left: [h1.endNode, h2.endNode, h3, h4],
    roots: [h1, h2, h3, h4, v1, v2, v3, v4],
  };
};

export { IntersectNode };
