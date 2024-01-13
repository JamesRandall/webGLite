import {vec3} from "gl-matrix";
import {isInRotatedBox} from "./collisions";

describe('Collisions', () => {
    test('Collision at origin', () => {
        const noseOrientation = vec3.fromValues(0,0,1)
        const roofOrientation = vec3.fromValues(0, 1, 0)
        const sideOrientation = vec3.fromValues(1, 0, 0)
        const position = vec3.fromValues(0, 0, 0)
        const size = vec3.fromValues(10,2,2)

        const isCollision = isInRotatedBox(
            position,
            noseOrientation,
            roofOrientation,
            sideOrientation,
            size
        )

        expect(isCollision).toBeTruthy()
    })

    test('Collision at right', () => {
        const noseOrientation = vec3.fromValues(0,0,1)
        const roofOrientation = vec3.fromValues(0, 1, 0)
        const sideOrientation = vec3.fromValues(1, 0, 0)
        const position = vec3.fromValues(4, 0, 0)
        const size = vec3.fromValues(10,2,2)

        const isCollision = isInRotatedBox(
            position,
            noseOrientation,
            roofOrientation,
            sideOrientation,
            size
        )

        expect(isCollision).toBeTruthy()
    })

    test('No collision', () => {
        const noseOrientation = vec3.fromValues(0,0,1)
        const roofOrientation = vec3.fromValues(0, 1, 0)
        const sideOrientation = vec3.fromValues(1, 0, 0)
        const position = vec3.fromValues(0, 0, 1.5)
        const size = vec3.fromValues(10,2,2)

        const isCollision = isInRotatedBox(
            position,
            noseOrientation,
            roofOrientation,
            sideOrientation,
            size
        )

        expect(isCollision).toBeFalsy()
    })

    test('No collision when rotated 45 degrees around z', () => {
        const noseOrientation = vec3.fromValues(0,0,1)
        const roofOrientation = vec3.fromValues(0, 1, 0)
        const sideOrientation = vec3.fromValues(1, 0, 0)
        const position = vec3.fromValues(4, 0, 0)
        const size = vec3.fromValues(10,2,2)

        const isCollision = isInRotatedBox(
            position,
            noseOrientation,
            roofOrientation,
            sideOrientation,
            size
        )

        expect(isCollision).toBeTruthy()
    })
})