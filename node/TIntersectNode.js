import { curveNode } from "./curveNode.js";
import { straightNode } from "./straightNode.js";

const TIntersectNode = ({ location, angle = 0 }) => {
  let result = [];
  let [v1, v2, v3, v4] = straightNode({
    isVertical: true,
    isIntersect: false,
    location,
  });
  let [h1, h2, h3, h4] = straightNode({
    isVertical: false,
    isIntersect: false,
    location,
  });
  if (angle === 0) {
    h3.resetNode();
    h4.resetNode();
    let [, , c3, c4] = curveNode({
      angle: 360,
      location,
      rootNodes: [v1, v2, h3, h4],
      endNodes: [h1.endNode, h2.endNode, v3.endNode, v4.endNode],
    });
    curveNode({
      angle: 90,
      location,
      rootNodes: [c4, c3, v3, v4],
      endNodes: [v1.endNode, v2.endNode, h2.endNode, h1.endNode],
    });
    result = {
      location,
      top: [v1, v2, v3.endNode, v4.endNode],
      bottom: [v1.endNode, v2.endNode, v3, v4],
      left: [h1.endNode, h2.endNode, c3, c4],
      roots: [v1, v2, v3, v4, c3, c4],
    };
  } else if (angle === 90) {
    curve1 = curveNode({ angle: 90, location });
    curve2 = curveNode({ angle: 180, location });
    straight = straightNode({ isIntersect: false, location });
  } else if (angle === 180) {
    curve1 = curveNode({ angle: 180, location });
    curve2 = curveNode({ angle: 270, location });
    straight = straightNode({ isVertical: true, isIntersect: false, location });
  } else if (angle === 270) {
    curve1 = curveNode({ angle: 270, location });
    curve2 = curveNode({ angle: 360, location });
    straight = straightNode({ location });
  }
  return result;
};

export { TIntersectNode };
