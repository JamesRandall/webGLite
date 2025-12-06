import { Game, SceneEnum } from "../../model/game"
import { ShipInstance } from "../../model/ShipInstance"
import { vec2, vec3 } from "gl-matrix"

export function findShipInCrosshairs(game: Game) {
  const isRearView = game.currentScene === SceneEnum.Rear
  const isLeftView = game.currentScene === SceneEnum.Left
  const isRightView = game.currentScene === SceneEnum.Right

  return game.localBubble.ships.reduce((hit: ShipInstance | null, ship) => {
    if (isRearView) {
      // Rear view: ships must be behind player (positive Z)
      if (ship.position[2] < 0) return hit
      // Prefer closer ships (smaller positive Z)
      if (hit !== null && hit.position[2] < ship.position[2]) return hit
    } else if (isLeftView) {
      // Left view: ships must be to the left of player (negative X)
      if (ship.position[0] > 0) return hit
      // Prefer closer ships (larger negative X, i.e., closer to 0)
      if (hit !== null && hit.position[0] > ship.position[0]) return hit
    } else if (isRightView) {
      // Right view: ships must be to the right of player (positive X)
      if (ship.position[0] < 0) return hit
      // Prefer closer ships (smaller positive X, i.e., closer to 0)
      if (hit !== null && hit.position[0] < ship.position[0]) return hit
    } else {
      // Front view: ships must be in front of player (negative Z)
      if (ship.position[2] > 0) return hit
      // Prefer closer ships (larger negative Z, i.e., closer to 0)
      if (hit !== null && hit.position[2] > ship.position[2]) return hit
    }

    const translatedBoundingBox = ship.boundingBox.map((v) => {
      const v2 = vec3.add(vec3.create(), v, ship.position)
      if (isRearView) {
        // Rear view: use X and Y, flip X for mirror
        return vec2.fromValues(-v2[0], v2[1])
      } else if (isLeftView) {
        // Left view: use Z and Y (Z becomes screen X, flipped because looking left)
        return vec2.fromValues(-v2[2], v2[1])
      } else if (isRightView) {
        // Right view: use Z and Y (Z becomes screen X)
        return vec2.fromValues(v2[2], v2[1])
      } else {
        // Front view: use X and Y
        return vec2.fromValues(v2[0], v2[1])
      }
    })
    // This depends very much on the order that the bounding box is created in
    const faces = [
      // front
      [0, 1, 2, 3],
      // back
      [4, 5, 6, 7],
      // left
      [0, 3, 4, 7],
      // right
      [1, 2, 5, 6],
      // top
      [0, 1, 5, 6],
      // bottom
      [2, 3, 6, 7],
    ]
    const testPoint = vec2.fromValues(0, 0)
    for (let fi = 0; fi < faces.length; fi++) {
      const face = faces[fi]
      const quad = [
        translatedBoundingBox[face[0]],
        translatedBoundingBox[face[1]],
        translatedBoundingBox[face[2]],
        translatedBoundingBox[face[3]],
      ]
      const triangles = createTrianglesFromQuad(quad)
      if (isPointInTriangle(testPoint, triangles[0]) || isPointInTriangle(testPoint, triangles[1])) {
        return ship
      }
    }

    return hit
  }, null)
}

function createTrianglesFromQuad(quad: vec2[]) {
  return [
    [quad[0], quad[1], quad[2]],
    [quad[2], quad[3], quad[0]],
  ]
}

// barycentric approach
function isPointInTriangle(point: vec2, [p1, p2, p3]: vec2[]) {
  let a =
    ((p2[1] - p3[1]) * (point[0] - p3[0]) + (p3[0] - p2[0]) * (point[1] - p3[1])) /
    ((p2[1] - p3[1]) * (p1[0] - p3[0]) + (p3[0] - p2[0]) * (p1[1] - p3[1]))
  let b =
    ((p3[1] - p1[1]) * (point[0] - p3[0]) + (p1[0] - p3[0]) * (point[1] - p3[1])) /
    ((p2[1] - p3[1]) * (p1[0] - p3[0]) + (p3[0] - p2[0]) * (p1[1] - p3[1]))
  let c = 1.0 - a - b
  return a >= 0 && a <= 1 && b >= 0 && b <= 1 && c >= 0 && c <= 1
}
