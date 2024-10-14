const lerp = (A, B, t) => A + (B - A) * t;

const getLineIntersection = (line1, line2) => {
  const [A, B] = line1;
  const [C, D] = line2;

  const t = calculateOffsets(A, B, C, D);
  const u = calculateOffsets(C, D, A, B);
  if (t && u) {
    return {
      x: lerp(A.x, B.x, t),
      y: lerp(A.y, B.y, t),
      offset: t,
    };
  }
  return null;
};

const calculateOffsets = (A, B, C, D) => {
  const top = (D.y - C.y) * (A.x - C.x) - (D.x - C.x) * (A.y - C.y);
  const bottom = (D.x - C.x) * (B.y - A.y) - (D.y - C.y) * (B.x - A.x);
  if (bottom != 0.0) {
    const offset = top / bottom;
    if (offset >= 0 && offset <= 1) {
      return offset;
    }
  }
  return null;
};

function getCorners(rect) {
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const angle = rect.angle;

  const dx = rect.width / 2;
  const dy = rect.height / 2;

  return [
    rotatePoint(cx, cy, rect.x, rect.y, angle),
    rotatePoint(cx, cy, rect.x + rect.width, rect.y, angle),
    rotatePoint(cx, cy, rect.x + rect.width, rect.y + rect.height, angle),
    rotatePoint(cx, cy, rect.x, rect.y + rect.height, angle),
  ];
}

function rotatePoint(cx, cy, x, y, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const dx = x - cx;
  const dy = y - cy;

  return {
    x: cx + dx * cos - dy * sin,
    y: cy + dx * sin + dy * cos,
  };
}

function project(corners, axis) {
  let min = corners[0].x * axis.x + corners[0].y * axis.y;
  let max = min;
  for (let i = 1; i < corners.length; i++) {
    const projection = corners[i].x * axis.x + corners[i].y * axis.y;
    if (projection < min) {
      min = projection;
    }
    if (projection > max) {
      max = projection;
    }
  }
  return { min, max };
}

function isOverlapping(proj1, proj2) {
  return proj1.max >= proj2.min && proj2.max >= proj1.min;
}

function isRectColliding(rect1, rect2) {
  const corners1 = getCorners(rect1);
  const corners2 = getCorners(rect2);

  // The 4 axes to test (the edges' normals of the two rectangles)
  const axes = [
    { x: corners1[1].x - corners1[0].x, y: corners1[1].y - corners1[0].y },
    { x: corners1[3].x - corners1[0].x, y: corners1[3].y - corners1[0].y },
    { x: corners2[1].x - corners2[0].x, y: corners2[1].y - corners2[0].y },
    { x: corners2[3].x - corners2[0].x, y: corners2[3].y - corners2[0].y },
  ];

  // Normalize the axes
  axes.forEach((axis) => {
    const length = Math.sqrt(axis.x * axis.x + axis.y * axis.y);
    axis.x /= length;
    axis.y /= length;
  });

  // Check projections onto all axes
  for (let axis of axes) {
    const proj1 = project(corners1, axis);
    const proj2 = project(corners2, axis);

    if (!isOverlapping(proj1, proj2)) {
      return false; // If any projection does not overlap, there's no collision
    }
  }

  return true; // If all projections overlap, the rectangles are colliding
}

export { getLineIntersection, isRectColliding };
