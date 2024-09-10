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
  let currentAngle = direction === 1 ? 0 : 90;
  const result = [];
  for (let i = 0; i < deviceTo + 1; i++) {
    const radians = (currentAngle + angle) * (Math.PI / 180);
    result.push({
      x: parseFloat((radius * Math.cos(radians)).toFixed(2)) + offset.x,
      y: parseFloat((radius * Math.sin(radians)).toFixed(2)) + offset.y,
    });
    currentAngle += (90 / deviceTo) * direction;
  }
  return result;
};

// const calculateSpeedComponents = (speed, angle) => {
//   // Convert angle to radians
//   const angleInRadians = angle * (Math.PI / 180);

//   // Calculate speed components
//   const speedX = speed * Math.cos(angleInRadians);
//   const speedY = speed * Math.sin(angleInRadians);
//   return { speedX, speedY };
// };

const calculateDistanceAndAngle = ({ position1, position2 }) => {
  const { x: x1, y: y1 } = position1;
  const { x: x2, y: y2 } = position2;

  // Calculate distance between points
  const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

  // Calculate angle between points
  const angleRadians = Math.atan2(y2 - y1, x2 - x1);
  const angleDegrees = angleRadians * (180 / Math.PI);
  return {
    length: length.toFixed(2),
    angle: angleDegrees.toFixed(2),
  };
};

const calculateSpeedComponents = (currentPosition, targetPosition, speed) => {
  // Extract positions
  const { x: x1, z: y1 } = currentPosition;
  const { x: x2, y: y2 } = targetPosition;

  // Calculate the difference in position
  const deltaX = x2 - x1;
  const deltaY = y2 - y1;

  // Calculate distance between current and target positions
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  // Avoid division by zero in case currentPosition and targetPosition are the same
  if (distance === 0) {
    return { speedX: 0, speedY: 0 };
  }

  // Calculate the speed components
  const speedX = (deltaX / distance) * speed;
  const speedY = (deltaY / distance) * speed;

  return { speedX, speedY };
};

const calculateHypotenuse = (a, b) => {
  return Math.sqrt(a * a + b * b);
};

export {
  getPoints,
  calculateDistanceAndAngle,
  calculateSpeedComponents,
  calculateHypotenuse,
};
