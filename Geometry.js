import * as THREE from "three";

export default class Geometry {
  static box({
    height = 1,
    color = 0xffffff,
    width = 1,
    length = 1,
    wireframe = false,
    position = { x: 0, y: 0, z: 0 },
  }) {
    const geometry = new THREE.BoxGeometry(width, height, length);
    const material = new THREE.MeshLambertMaterial({ color, wireframe });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, position.y, position.z);
    return mesh;
  }

  static circle({ radius, color, wireframe = false }) {
    // Create the geometry for the circle
    const circleGeometry = new THREE.CircleGeometry(radius, 32);

    // Create a material for the circle
    const circleMaterial = new THREE.MeshBasicMaterial({ color, wireframe });

    // Create the circle mesh
    return new THREE.Mesh(circleGeometry, circleMaterial);
  }

  static rec({ width, length, color = 0x00ff00, wireframe }) {
    // Create a 2D rectangle using PlaneGeometry
    const geometry = new THREE.PlaneGeometry(width, length);

    // Material for the rectangle
    const material = new THREE.MeshBasicMaterial({ color, wireframe });

    // Create the mesh
    const rectangle = new THREE.Mesh(geometry, material);
    return rectangle;
  }

  static nGon({
    sides = 6,
    color = 0xd3d3d3,
    radius = 5,
    wireframe = false,
    position = { x: 0, y: 0, z: 0 },
    rotation = 0,
  }) {
    // Create a shape for the octagon
    const shape = new THREE.Shape();

    // Define the vertices of the octagon
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2; // Angle for each vertex
      const x = radius * Math.cos(angle); // X coordinate
      const y = radius * Math.sin(angle); // Y coordinate
      if (i === 0) {
        shape.moveTo(x, y); // Start the shape at the first vertex
      } else {
        shape.lineTo(x, y); // Draw lines to the other vertices
      }
    }

    // Close the shape
    shape.closePath();

    // Create geometry from the shape
    const geometry = new THREE.ShapeGeometry(shape);

    // Create a material
    const material = new THREE.MeshBasicMaterial({ color, wireframe });

    // Create the mesh from geometry and material
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, position.y, position.z);
    mesh.rotation.z = rotation;
    return mesh;
  }

  static sphere({
    height = 1,
    color = 0xd3d3d3,
    width = 1,
    radius = 1,
    wireframe = false,
  }) {
    const geometry = new THREE.SphereGeometry(radius, width, height);
    const material = new THREE.MeshBasicMaterial({ color, wireframe });
    return new THREE.Mesh(geometry, material);
  }

  static cone({
    radialSegments = 10,
    color = 0xd3d3d3,
    height = 1,
    radius = 0.02,
    wireframe = false,
  }) {
    const geometry = new THREE.ConeGeometry(radius, height, radialSegments);
    const material = new THREE.MeshLambertMaterial({ color, wireframe });
    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  static cylinder({
    height = 1,
    radiusTop = 0.02,
    radiusBottom = 0.02,
    radialSegments = 10,
    color = 0xd3d3d3,
  }) {
    const geometry = new THREE.CylinderGeometry(
      radiusTop,
      radiusBottom,
      height,
      radialSegments
    );
    const material = new THREE.MeshLambertMaterial({ color });

    const cylinder = new THREE.Mesh(geometry, material);

    return cylinder;
  }

  static point({
    position = { x: 0, y: 0 },
    radius = 0.02,
    color = 0xd3d3d3,
    name = "Point",
  }) {
    const sphere = Geometry.sphere({
      height: 16,
      width: 32,
      radius, // Use the radius parameter
      color,
    });

    sphere.position.set(position.x, 0, position.y);
    sphere.name = name;
    return sphere;
  }

  static arrow({
    position = { x: 0, z: 0 },
    length = 1,
    yRotation = 0,
    color = 0xd3d3d3,
    name = "Arrow",
  }) {
    const sphere = Geometry.sphere({
      height: 16,
      width: 32,
      radius: 0.02,
      color,
    });
    sphere.position.set(position.x, 0, position.y);
    const cone = Geometry.cone({
      height: length - 0.01,
      radialSegments: 10,
      radius: 0.02,
      color: 0xd3d3d3,
    });
    cone.position.set(length / 2 + 0.01, 0, 0);
    cone.rotation.z = -Math.PI / 2;

    sphere.rotation.y = yRotation * (Math.PI / 180);
    sphere.add(cone);
    sphere.name = name;
    return sphere;
  }
}
