import { Node } from "./node.js";

const straightNode = ({ isVertical = false, isIntersect = true, location }) => {
  let result = [];
  const { x, y } = location;
  if (isVertical) {
    result = [
      {
        root: { x: x - 0.16, y: y - 0.5 },
        childs: [
          [
            { x: x - 0.16, y: y },
            { x: x - 0.16, y: y + 0.5 },
          ],
        ],
      },
      {
        root: { x: x - 0.05, y: y - 0.5 },
        childs: [
          [
            { x: x - 0.05, y: y },
            { x: x - 0.05, y: y + 0.5 },
          ],
        ],
      },
      {
        root: { x: x + 0.05, y: y + 0.5 },
        childs: [
          [
            { x: x + 0.05, y: y },
            { x: x + 0.05, y: y - 0.5 },
          ],
        ],
      },
      {
        root: { x: x + 0.16, y: y + 0.5 },
        childs: [
          [
            { x: x + 0.16, y: y },
            { x: x + 0.16, y: y - 0.5 },
          ],
        ],
      },
    ];
  } else {
    result = [
      {
        root: { x: x + 0.5, y: y - 0.16 },
        childs: [
          [
            { x: x, y: y - 0.16 },
            { x: x - 0.5, y: y - 0.16 },
          ],
        ],
      },
      {
        root: { x: x + 0.5, y: y - 0.05 },
        childs: [
          [
            { x: x, y: y - 0.05 },
            { x: x - 0.5, y: y - 0.05 },
          ],
        ],
      },
      {
        root: { x: x - 0.5, y: y + 0.05 },
        childs: [
          [
            { x: x, y: y + 0.05 },
            { x: x + 0.5, y: y + 0.05 },
          ],
        ],
      },
      {
        root: { x: x - 0.5, y: y + 0.16 },
        childs: [
          [
            { x: x, y: y + 0.16 },
            { x: x + 0.5, y: y + 0.16 },
          ],
        ],
      },
    ];
  }

  if (isIntersect === false) {
    result = result.map(({ root, childs }) => {
      return { root, childs: [[childs[0][1]]] };
    });
  }

  result = result.map(({ root, childs: rootChilds }) => {
    const rootNode = new Node({ location: { x: root.x, y: root.y } });
    rootChilds.forEach((childs) => {
      let currentNode = null;
      childs.forEach(({ x, y }) => {
        const newNode = new Node({ location: { x, y } });
        if (currentNode === null) {
          rootNode.addChild(newNode);
          currentNode = newNode;
        } else {
          currentNode.addChild(newNode);
          currentNode = newNode;
        }
      });
      if (rootNode.endNode === null) rootNode.setEndNode(currentNode);
    });
    return rootNode;
  });

  if (isIntersect) {
    result[0].addChild(result[1].children[0]);
    result[1].addChild(result[0].children[0]);
    result[2].addChild(result[3].children[0]);
    result[3].addChild(result[2].children[0]);
  }

  return result;
};

export { straightNode };
