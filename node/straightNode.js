const straightNode = ({ isVertical = false, location }) => {
  let result = [];
  const { x, y } = location;
  const length = 1;
  if (isVertical) {
    result = [
      { x: x - 0.16, y: y - 0.5, yRotation: 270, length },
      { x: x - 0.05, y: y - 0.5, yRotation: 270, length },
      { x: x + 0.05, y: y + 0.5, yRotation: 90, length },
      { x: x + 0.17, y: y + 0.5, yRotation: 90, length },
    ];
  } else {
    result = [
      { x: x + 0.5, y: y - 0.16, yRotation: 180, length },
      { x: x + 0.5, y: y - 0.05, yRotation: 180, length },
      { x: x - 0.5, y: y + 0.05, yRotation: 0, length },
      { x: x - 0.5, y: y + 0.16, yRotation: 0, length },
    ];
  }
  return result;
};

export { straightNode };
