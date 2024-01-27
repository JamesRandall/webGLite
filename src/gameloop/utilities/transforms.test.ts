import {
  calculateRotation,
  degreesToRadians,
  radiansToDegrees,
  rotateOrientationVectorsByPitchAndRoll,
} from "./transforms"
import { vec3 } from "gl-matrix"

function getOrientationVectors(rollDegrees: number, pitchDegrees: number) {
  const positionedObject = {
    position: vec3.fromValues(0, 0, 0),
    noseOrientation: vec3.fromValues(0, 0, -1),
    roofOrientation: vec3.fromValues(0, 1, 0),
    rightOrientation: vec3.fromValues(1, 0, 0),
    roll: 0,
    pitch: 0,
  }
  const rollRadians = degreesToRadians(rollDegrees)
  const pitchRadians = degreesToRadians(pitchDegrees)
  rotateOrientationVectorsByPitchAndRoll(positionedObject, rollRadians, pitchRadians)
  return [positionedObject.noseOrientation, positionedObject.roofOrientation, positionedObject.rightOrientation]
}

function calculateForAngles(rollDegrees: number, pitchDegrees: number) {
  const [no, ro, so] = getOrientationVectors(rollDegrees, pitchDegrees)
  return calculateRotation(no, ro, so).map(radiansToDegrees).map(Math.round)
}

describe("calculateRotation tests", () => {
  test("Axis aligned", () => {
    const [nr, rr, sr] = calculateRotation([0, 0, -1], [0, 1, 0], [1, 0, 0]).map(radiansToDegrees)
    expect(nr).toEqual(0)
    expect(rr).toEqual(0)
    expect(sr).toEqual(0)
  })

  test("45 degrees pitch", () => {
    const [nr, rr, sr] = calculateForAngles(0, 45)
    expect(nr).toEqual(45)
    expect(rr).toEqual(45)
    expect(sr).toEqual(0)
  })

  test("45 degrees roll", () => {
    const [nr, rr, sr] = calculateForAngles(45, 0)
    expect(nr).toEqual(0)
    expect(rr).toEqual(45)
    expect(sr).toEqual(45)
  })

  test("90 degrees roll", () => {
    const [nr, rr, sr] = calculateForAngles(90, 0)
    expect(nr).toEqual(0)
    expect(rr).toEqual(90)
    expect(sr).toEqual(90)
  })
})
