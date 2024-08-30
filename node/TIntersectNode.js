import { curveNode } from "./curveNode.js";
import { straightNode } from "./straightNode.js";

const TIntersectNode = ({ location, angle = 0 }) => {
  let result = [];
  if (angle === 0) {
    result = [
      ...curveNode({ angle: 360, location }),
      ...curveNode({ angle: 90, location }),
      ...straightNode({ isVertical: true, location }),
    ];
  } else if (angle === 90) {
    result = [
      ...curveNode({ angle: 90, location }),
      ...curveNode({ angle: 180, location }),
      ...straightNode({ location }),
    ];
  } else if (angle === 180) {
    result = [
      ...curveNode({ angle: 180, location }),
      ...curveNode({ angle: 270, location }),
      ...straightNode({ isVertical: true, location }),
    ];
  } else if (angle === 270) {
    result = [
      ...curveNode({ angle: 270, location }),
      ...curveNode({ angle: 360, location }),
      ...straightNode({ location }),
    ];
  }
  return result;
};

export { TIntersectNode };
