class Node {
  constructor({ position }) {
    this.position = position;
    this.children = []; // Consider renaming to `children` for clarity
    this.connectRootNode = null;
    this.endNode = null;
    this.isParent = true;
  }

  isRootNode() {
    return this.isParent;
  }

  resetNode() {
    this.children = [];
    this.endNode = null;
  }

  addChild(node) {
    if (!this.children.includes(node)) {
      this.children.push(node);
      node.isParent = false;
    }
  }

  addChilds(nodes) {
    nodes.forEach((node) => {
      this.addChild(node);
    });
  }

  connectToRootNode(rootNode) {
    rootNode.isParent = false;
    this.connectRootNode = rootNode;
    this.addChilds(rootNode.children);
  }
  connectToEndNode(endNode) {
    this.addChild(endNode);
  }

  setEndNode(node) {
    this.endNode = node;
  }

  isEndNode() {
    // A node is an end node if it has no children
    return this.children.length === 0;
  }

  // Collect all descendants recursively
  getRandomPath() {
    let endNode = this;
    let count = 0;
    while (this.endNode !== endNode && (count > 5 || Math.random() < 0.9)) {
      if (count < 5) count++;
      if (endNode.children.length > 0) {
        const randomIndex = Math.floor(Math.random() * endNode.children.length);
        const child = endNode.children[randomIndex];
        endNode = child;
      } else {
        break; // No children to traverse
      }
    }
    return this.findPath(endNode).map(({ position: { x, y } }) => `${x},${y}`);
  }

  findPath(endNode) {
    const openSet = new Set([this]); // Nodes to explore
    const cameFrom = new Map(); // To reconstruct the path

    const gScore = new Map(); // Cost from start to this node
    gScore.set(this, 0);

    const fScore = new Map(); // Estimated cost from start to end
    fScore.set(this, this.heuristic(this, endNode));

    while (openSet.size > 0) {
      // Get the node with the lowest fScore
      let current = [...openSet].reduce((a, b) =>
        fScore.get(a) < fScore.get(b) ? a : b
      );

      // If we reached the end node, reconstruct the path
      if (current === endNode) {
        return this.reconstructPath(cameFrom, current);
      }

      openSet.delete(current);

      for (let neighbor of current.children) {
        const tentativeGScore =
          gScore.get(current) + this.heuristic(current, neighbor);

        if (!gScore.has(neighbor) || tentativeGScore < gScore.get(neighbor)) {
          // Update the best path to the neighbor
          cameFrom.set(neighbor, current);
          gScore.set(neighbor, tentativeGScore);
          fScore.set(
            neighbor,
            tentativeGScore + this.heuristic(neighbor, endNode)
          );

          if (!openSet.has(neighbor)) {
            openSet.add(neighbor);
          }
        }
      }
    }

    return null; // No path found
  }

  heuristic(node, endNode) {
    const dx = node.position.x - endNode.position.x;
    const dy = node.position.y - endNode.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  reconstructPath(cameFrom, current) {
    const totalPath = [current];
    while (cameFrom.has(current)) {
      current = cameFrom.get(current);
      totalPath.push(current);
    }
    return totalPath.reverse(); // Reverse to get the correct order
  }

  // Returns all adjacent nodes (children)
  getNeighbors() {
    return this.children;
  }
}

export { Node };
