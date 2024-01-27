import { mat4, vec3 } from "gl-matrix"
import { PositionedObject } from "../../model/localBubble"
import { ShipInstance } from "../../model/ShipInstance"
import { Player } from "../../model/player"
import { Game } from "../../model/game"
import { jumpSpeedMultiplier, playerShipRelativeSpeedFudgeFactor, scannerRadialWorldRange } from "../../constants"

export function degreesToRadians(value: number) {
  return (value * Math.PI) / 180
}

export function radiansToDegrees(value: number) {
  return value * (180 / Math.PI)
}

// Calculates the roll of an object based on its orientation vectors
export function calculateRoll(object: PositionedObject) {
  const roofNoseDp = vec3.dot(object.roofOrientation, object.noseOrientation)
  const projectedRoof = vec3.subtract(
    vec3.create(),
    object.roofOrientation,
    vec3.multiply(vec3.create(), object.noseOrientation, [roofNoseDp, roofNoseDp, roofNoseDp]),
  )
  return Math.acos(vec3.dot(projectedRoof, [0, 1, 0]) / vec3.length(projectedRoof))
}

export function calculatePitch(object: PositionedObject) {
  const noseRoofDp = vec3.dot(object.noseOrientation, object.roofOrientation)
  const projectedNose = vec3.subtract(
    vec3.create(),
    object.noseOrientation,
    vec3.multiply(vec3.create(), object.roofOrientation, [noseRoofDp, noseRoofDp, noseRoofDp]),
  )
  return Math.asin(vec3.dot(projectedNose, object.roofOrientation) / vec3.length(projectedNose))
}

export function rotateOrientationVectorsByPitchAndRoll(object: PositionedObject, roll: number, pitch: number) {
  vec3.rotateZ(object.noseOrientation, object.noseOrientation, [0, 0, 0], roll)
  vec3.rotateZ(object.roofOrientation, object.roofOrientation, [0, 0, 0], roll)
  vec3.rotateZ(object.rightOrientation, object.rightOrientation, [0, 0, 0], roll)
  vec3.rotateX(object.noseOrientation, object.noseOrientation, [0, 0, 0], pitch)
  vec3.rotateX(object.roofOrientation, object.roofOrientation, [0, 0, 0], pitch)
  vec3.rotateX(object.rightOrientation, object.rightOrientation, [0, 0, 0], pitch)
  vec3.normalize(object.noseOrientation, object.noseOrientation)
  vec3.normalize(object.roofOrientation, object.roofOrientation)
  vec3.normalize(object.rightOrientation, object.rightOrientation)
}

export function rotateLocationInSpaceByPitchAndRoll(object: PositionedObject, roll: number, pitch: number) {
  vec3.rotateZ(object.position, object.position, [0, 0, 0], roll)
  vec3.rotateX(object.position, object.position, [0, 0, 0], pitch)
}

export function rotateVectorByOrientation(
  position: vec3,
  noseOrientation: vec3,
  roofOrientation: vec3,
  sideOrientation: vec3,
) {
  const matrix = mat4.fromValues(
    sideOrientation[0],
    roofOrientation[0],
    noseOrientation[0],
    0,
    sideOrientation[1],
    roofOrientation[1],
    noseOrientation[1],
    0,
    sideOrientation[2],
    roofOrientation[2],
    noseOrientation[2],
    0,
    0,
    0,
    0,
    1,
  )
  return vec3.transformMat4(vec3.create(), position, matrix)
}

export function calculatePlayerVelocity(player: Player, timeDelta: number) {
  const velocity = player.isJumping
    ? player.ship.maxSpeed * timeDelta * playerShipRelativeSpeedFudgeFactor * jumpSpeedMultiplier
    : player.speed * timeDelta * playerShipRelativeSpeedFudgeFactor
  return vec3.fromValues(0, 0, velocity)
}

export function calculateSpaceStationRotationSpeed(player: Player) {
  return -player.ship.maxRollSpeed / 4 // if we start allowing ships to be bought we need to base this on the Cobra
}

export function calculateSpaceStationPlanetDistance(game: Game) {
  return game.localBubble.planet.radius * 2
}

export function reverseVector(vector: vec3) {
  return vec3.fromValues(vector[0] * -1, vector[1] * -1, vector[2] * -1)
}

export function move(object: PositionedObject, delta: vec3) {
  vec3.add(object.position, object.position, delta)
}

export function calculateRotationForShip(object: PositionedObject) {
  const noseAngle = Math.acos(
    vec3.dot(object.noseOrientation, [0, 0, -1]) / (vec3.length(object.noseOrientation) * vec3.length([0, 0, -1])),
  )
  const roofAngle = Math.acos(
    vec3.dot(object.roofOrientation, [0, 1, 0]) / (vec3.length(object.roofOrientation) * vec3.length([0, 1, 0])),
  )
  const sideAngle = Math.acos(
    vec3.dot(object.rightOrientation, [1, 0, 0]) / (vec3.length(object.rightOrientation) * vec3.length([1, 0, 0])),
  )

  return [noseAngle, roofAngle, sideAngle]
}

export function calculateRotation(noseOrientation: vec3, roofOrientation: vec3, sideOrientation: vec3) {
  const noseAngle = Math.acos(
    vec3.dot(noseOrientation, [0, 0, -1]) / (vec3.length(noseOrientation) * vec3.length([0, 0, -1])),
  )
  const roofAngle = Math.acos(
    vec3.dot(roofOrientation, [0, 1, 0]) / (vec3.length(roofOrientation) * vec3.length([0, 1, 0])),
  )
  const sideAngle = Math.acos(
    vec3.dot(sideOrientation, [1, 0, 0]) / (vec3.length(sideOrientation) * vec3.length([1, 0, 0])),
  )

  return [noseAngle, roofAngle, sideAngle]
}
