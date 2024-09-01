class Node {
  constructor({ location }) {
    this.location = location;
    this.children = []; // Consider renaming to `children` for clarity
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

  setEndNode(node) {
    this.endNode = node;
  }

  isEndNode() {
    // A node is an end node if it has no children
    return this.children.length === 0;
  }
}

export { Node };
