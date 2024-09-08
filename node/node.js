class Node {
  constructor({ position }) {
    this.position = position;
    this.children = []; // Consider renaming to `children` for clarity
    this.connectRootNode = null;
    this.endNode = null;
    this.isParent = true;
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
    const root = new Node({ position: this.position });
    let rootCurrent = root;
    let current = this;
    while (!current.isEndNode()) {
      if (current.children.length > 0) {
        const randomIndex = Math.floor(Math.random() * current.children.length);
        const child = current.children[randomIndex];

        // Create a new node for the path with the child's position
        const newNode = new Node({ position: child.position });
        rootCurrent.addChild(newNode);

        // Move forward in the path
        rootCurrent = newNode;
        current = child;
      } else {
        break; // No children to traverse
      }
    }
    root.endNode = rootCurrent;
    return root;
  }

  distanceTo(node) {
    const dx = this.position.x - node.position.x;
    const dy = this.position.y - node.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Returns all adjacent nodes (children)
  getNeighbors() {
    return this.children;
  }
}

export { Node };
