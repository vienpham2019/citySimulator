import { getPoints } from "../helper/point.js";

const curveNode = ({ angle = 90, location }) => {
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

  arrPoints.forEach((p) => {
    result.push(
      ...getPoints(p).map(({ x, y, length, angle }) => {
        return {
          x: x + location.x + offset.x,
          y: y + location.y + offset.y,
          length,
          yRotation: -angle,
        };
      })
    );
  });

  return result;
};

export { curveNode };
