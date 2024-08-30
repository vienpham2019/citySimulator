import { curveNode } from "./curveNode.js";
import { straightNode } from "./straightNode.js";

const IntersectNode = ({ location }) => {
  let result = [
    ...curveNode({ angle: 90, location }),
    ...curveNode({ angle: 180, location }),
    ...curveNode({ angle: 180, location }),
    ...curveNode({ angle: 270, location }),
    ...straightNode({ isVertical: true, location }),
    ...straightNode({ location }),
  ];

  return result;
};

export { IntersectNode };
