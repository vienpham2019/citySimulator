import * as THREE from "three";

export default class Geometry {
  static box({
    height = 1,
    color = 0xffffff,
    width = 1,
    length = 1,
    wireframe = false,
  }) {
    const geometry = new THREE.BoxGeometry(width, height, length);
    const material = new THREE.MeshLambertMaterial({ color, wireframe });
    return new THREE.Mesh(geometry, material);
  }

  static sphere({
    height = 1,
    color = 0xffffff,
    width = 1,
    radius = 1,
    wireframe = false,
  }) {
    const geometry = new THREE.SphereGeometry(radius, width, height);
    const material = new THREE.MeshLambertMaterial({ color, wireframe });
    return new THREE.Mesh(geometry, material);
  }

  static cone({
    radialSegments = 1,
    color = 0xffffff,
    height = 1,
    radius = 1,
    wireframe = false,
  }) {
    const geometry = new THREE.ConeGeometry(radius, height, radialSegments);
    const material = new THREE.MeshLambertMaterial({ color, wireframe });
    return new THREE.Mesh(geometry, material);
  }

  static arrow({
    position = { x: 0, y: 0, z: 0 },
    length = 1,
    yRotation = 0,
    color = 0xffffff,
  }) {
    const sphere = Geometry.sphere({
      height: 16,
      width: 32,
      radius: 0.02,
      color,
    });
    sphere.position.set(position.x, position.y, position.z);
    const cone = Geometry.cone({
      height: length,
      radialSegments: 10,
      radius: 0.02,
      color,
    });
    cone.position.set(length / 2, 0, 0);
    cone.rotation.z = -Math.PI / 2;

    sphere.rotation.y = yRotation * (Math.PI / 180);
    sphere.add(cone);
    sphere.name = "Arrow";
    return sphere;
  }
}
