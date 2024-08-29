const getPoints = ({
  a,
  b,
  angle = 90,
  offset = { x: 0.5, y: -0.5 },
  deviceTo = 5,
  direction = 1,
}) => {
  const { x: x1, y: y1 } = a;
  const { x: x2, y: y2 } = b;
  const radius = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  let currentAngle = direction === 1 ? angle / deviceTo : angle;
  const result = [];
  if (direction === 1) {
    result.push({
      x: x1 + offset.x,
      y: y1 + offset.y,
    });
  }
  for (let i = 0; i < deviceTo; i++) {
    const radians = currentAngle * (Math.PI / 180);
    result.push({
      x: parseFloat((radius * Math.cos(radians)).toFixed(2)) + offset.x,
      y: parseFloat((radius * Math.sin(radians)).toFixed(2)) + offset.y,
    });
    currentAngle += (angle / deviceTo) * direction;
  }
  if (direction === -1) {
    result.push({
      x: x1 + offset.x,
      y: y1 + offset.y,
    });
  }
  return calculateDistancesAndAngles(result);
};

const calculateDistancesAndAngles = (points) => {
  const lengthsAndAngles = [];

  for (let i = 0; i < points.length - 1; i++) {
    const { x: x1, y: y1 } = points[i];
    const { x: x2, y: y2 } = points[i + 1];

    // Calculate distance between points
    const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

    // Calculate angle between points
    const angleRadians = Math.atan2(y2 - y1, x2 - x1);
    const angleDegrees = angleRadians * (180 / Math.PI);

    lengthsAndAngles.push({
      x: x1,
      y: y1,
      length: parseFloat(length.toFixed(2)),
      angle: parseFloat(angleDegrees.toFixed(2)),
    });
  }

  return lengthsAndAngles;
};

export { getPoints };
