import { vec3 } from "gl-matrix"
import { isInRotatedBox } from "./collisions"
import { degreesToRadians } from "./transforms"

describe("Collisions", () => {
  test("Collision at origin", () => {
    const noseOrientation = vec3.fromValues(0, 0, 1)
    const roofOrientation = vec3.fromValues(0, 1, 0)
    const sideOrientation = vec3.fromValues(1, 0, 0)
    const position = vec3.fromValues(0, 0, 0)
    const size = vec3.fromValues(10, 2, 2)

    const isCollision = isInRotatedBox(position, noseOrientation, roofOrientation, sideOrientation, size)

    expect(isCollision).toBeTruthy()
  })

  test("Collision at right", () => {
    const noseOrientation = vec3.fromValues(0, 0, 1)
    const roofOrientation = vec3.fromValues(0, 1, 0)
    const sideOrientation = vec3.fromValues(1, 0, 0)
    const position = vec3.fromValues(4, 0, 0)
    const size = vec3.fromValues(10, 2, 2)

    const isCollision = isInRotatedBox(position, noseOrientation, roofOrientation, sideOrientation, size)

    expect(isCollision).toBeTruthy()
  })

  test("No collision", () => {
    const noseOrientation = vec3.fromValues(0, 0, 1)
    const roofOrientation = vec3.fromValues(0, 1, 0)
    const sideOrientation = vec3.fromValues(1, 0, 0)
    const position = vec3.fromValues(0, 0, 1.5)
    const size = vec3.fromValues(10, 2, 2)

    const isCollision = isInRotatedBox(position, noseOrientation, roofOrientation, sideOrientation, size)

    expect(isCollision).toBeFalsy()
  })

  test("No collision when rotated 45 degrees around z and box positioned to left", () => {
    const noseOrientation = vec3.fromValues(0, 0, -1)
    const roofOrientation = vec3.fromValues(0, 1, 0)
    const sideOrientation = vec3.fromValues(1, 0, 0)
    const position = vec3.fromValues(-2, 0, 0)
    const size = vec3.fromValues(10, 2, 2)

    vec3.rotateZ(roofOrientation, roofOrientation, [0, 0, 0], degreesToRadians(45))
    vec3.rotateZ(sideOrientation, sideOrientation, [0, 0, 0], degreesToRadians(45))

    const isCollision = isInRotatedBox(position, noseOrientation, roofOrientation, sideOrientation, size)

    expect(isCollision).toBeFalsy()
  })

  test("Collision when rotated 45 degrees around z and box positioned to right and up, so player to bottom left when rotated", () => {
    const noseOrientation = vec3.fromValues(0, 0, -1)
    const roofOrientation = vec3.fromValues(0, 1, 0)
    const sideOrientation = vec3.fromValues(1, 0, 0)
    const position = vec3.fromValues(2, 3, 0)
    const size = vec3.fromValues(10, 5, 5)

    vec3.rotateZ(noseOrientation, noseOrientation, [0, 0, 0], degreesToRadians(45))
    vec3.rotateZ(roofOrientation, roofOrientation, [0, 0, 0], degreesToRadians(45))
    vec3.rotateZ(sideOrientation, sideOrientation, [0, 0, 0], degreesToRadians(45))

    const isCollision = isInRotatedBox(position, noseOrientation, roofOrientation, sideOrientation, size)

    expect(isCollision).toBeTruthy()
  })
})
