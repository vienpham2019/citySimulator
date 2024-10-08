import { curveNode } from "./curveNode.js";
import { straightNode } from "./straightNode.js";

const TIntersectNode = ({ position, angle = 0 }) => {
  let result = [];
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
  if (angle === 0) {
    h3.resetNode();
    h4.resetNode();
    let [, , c3, c4] = curveNode({
      angle: 360,
      position,
      rootNodes: [v1, v2, h3, h4],
      endNodes: [h1.endNode, h2.endNode, v3.endNode, v4.endNode],
    }).roots;
    curveNode({
      angle: 90,
      position,
      rootNodes: [c4, c3, v3, v4],
      endNodes: [v1.endNode, v2.endNode, h2.endNode, h1.endNode],
    });
    result = {
      position,
      top: [v1, v2, v3.endNode, v4.endNode],
      bottom: [v1.endNode, v2.endNode, v3, v4],
      left: [h1.endNode, h2.endNode, c3, c4],
      roots: [v1, v2, v3, v4, c3, c4],
    };
  } else if (angle === 90) {
    v3.resetNode();
    v4.resetNode();
    let [, , c3, c4] = curveNode({
      angle: 90,
      position,
      rootNodes: [h4, h3, v3, v4],
      endNodes: [v1.endNode, v2.endNode, h2.endNode, h1.endNode],
    }).roots;
    curveNode({
      angle: 180,
      position,
      rootNodes: [c4, c3, h2, h1],
      endNodes: [h4.endNode, h3.endNode, v2.endNode, v1.endNode],
    });
    result = {
      position,
      right: [h1, h2, h3.endNode, h4.endNode],
      bottom: [v1.endNode, v2.endNode, c3, c4],
      left: [h1.endNode, h2.endNode, h3, h4],
      roots: [h1, h2, h3, h4, c3, c4],
    };
  } else if (angle === 180) {
    h1.resetNode();
    h2.resetNode();
    let [, , c3, c4] = curveNode({
      angle: 180,
      position,
      rootNodes: [v4, v3, h2, h1],
      endNodes: [h4.endNode, h3.endNode, v2.endNode, v1.endNode],
    }).roots;
    curveNode({
      angle: 270,
      position,
      rootNodes: [c4, c3, v2, v1],
      endNodes: [v4.endNode, v3.endNode, h3.endNode, h4.endNode],
    });
    result = {
      position,
      top: [v1, v2, v3.endNode, v4.endNode],
      right: [c4, c3, h3.endNode, h4.endNode],
      bottom: [v1.endNode, v2.endNode, v3, v4],
      roots: [v1, v2, v3, v4, c3, c4],
    };
  } else if (angle === 270) {
    v1.resetNode();
    v2.resetNode();
    let [, , c3, c4] = curveNode({
      angle: 270,
      position,
      rootNodes: [h1, h2, v2, v1],
      endNodes: [v4.endNode, v3.endNode, h3.endNode, h4.endNode],
    }).roots;
    curveNode({
      angle: 360,
      position,
      rootNodes: [c4, c3, h3, h4],
      endNodes: [h1.endNode, h2.endNode, v3.endNode, v4.endNode],
    });

    result = {
      position,
      top: [c4, c3, v3.endNode, v4.endNode],
      right: [h1, h2, h3.endNode, h4.endNode],
      left: [h1.endNode, h2.endNode, h3, h4],
      roots: [h1, h2, h3, h4, c3, c4],
    };
  }
  return result;
};

export { TIntersectNode };
