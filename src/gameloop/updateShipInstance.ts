import { Player } from "../model/player"
import { mat4, quat, vec3 } from "gl-matrix"
import { playerShipRelativeSpeedFudgeFactor } from "../constants"
import { ShipInstance } from "../model/ShipInstance"
import {
  calculatePlayerVelocity,
  rotateLocationInSpaceByPitchAndRoll,
  rotateOrientationVectorsByPitchAndRoll,
} from "./utilities/transforms"

// Based on this game loop: https://www.bbcelite.com/deep_dives/program_flow_of_the_ship-moving_routine.html
export function updateShipInstance(shipInstance: ShipInstance, player: Player, timeDelta: number) {
  applyTactics(shipInstance)
  moveShipBySpeed(shipInstance, timeDelta)
  applyAcceleration(shipInstance, timeDelta)
  rotateLocationInSpaceByPlayerPitchAndRoll(shipInstance, player, timeDelta)
  moveShipByPlayerSpeed(shipInstance, player, timeDelta)
  rotateAccordingToPlayerPitchAndRoll(shipInstance, player, timeDelta)
  rotateShipByPitchAndRoll(shipInstance, timeDelta)
}

function applyTactics(shipInstance: ShipInstance) {
  // update the ships tactics
}

function moveShipBySpeed(shipInstance: ShipInstance, timeDelta: number) {
  // move the ship by its speed along its orientation vector
  const speed = shipInstance.speed * timeDelta * playerShipRelativeSpeedFudgeFactor
  const transform = vec3.multiply(
    vec3.create(),
    shipInstance.fixedDirectionOfMovement ?? shipInstance.noseOrientation,
    [speed, speed, speed],
  )
  shipInstance.position = vec3.add(vec3.create(), shipInstance.position, transform)
}

function applyAcceleration(shipInstance: ShipInstance, timeDelta: number) {
  // apply acceleration if required and then zero acceleration as its a one off operation
}

function rotateLocationInSpaceByPlayerPitchAndRoll(shipInstance: ShipInstance, player: Player, timeDelta: number) {
  rotateLocationInSpaceByPitchAndRoll(shipInstance, player.roll * timeDelta, player.pitch * timeDelta)
}

function moveShipByPlayerSpeed(shipInstance: ShipInstance, player: Player, timeDelta: number) {
  // I want to specify the velocities in the units given in the Elite manual but want the in game velocity to be
  // accurate to the original - this fudge factor lands us in about the right ballpark
  const velocity = calculatePlayerVelocity(player, timeDelta)
  vec3.add(shipInstance.position, shipInstance.position, velocity)
}

function rotateAccordingToPlayerPitchAndRoll(shipInstance: ShipInstance, player: Player, timeDelta: number) {
  const roll = player.roll * timeDelta
  const pitch = player.pitch * timeDelta
  rotateOrientationVectorsByPitchAndRoll(shipInstance, roll, pitch)
  shipInstance.boundingBox.forEach((v) => {
    vec3.rotateZ(v, v, [0, 0, 0], player.roll * timeDelta)
    vec3.rotateX(v, v, [0, 0, 0], player.pitch * timeDelta)
  })
  if (shipInstance.fixedDirectionOfMovement !== null) {
    vec3.rotateZ(shipInstance.fixedDirectionOfMovement, shipInstance.fixedDirectionOfMovement, [0, 0, 0], roll)
    vec3.rotateX(shipInstance.fixedDirectionOfMovement, shipInstance.fixedDirectionOfMovement, [0, 0, 0], pitch)
    vec3.normalize(shipInstance.fixedDirectionOfMovement, shipInstance.fixedDirectionOfMovement)
  }
}

function rotateShipByPitchAndRoll(shipInstance: ShipInstance, timeDelta: number) {
  // For roll we need to rotate our roof axis and right axis around our nose orientation
  const rollRotationMatrix = mat4.create()
  mat4.rotate(rollRotationMatrix, rollRotationMatrix, shipInstance.roll * timeDelta, shipInstance.noseOrientation)
  // For pitch we need to rotate our nose axis and roof axis around the right axis
  const pitchRotationMatrix = mat4.create()
  mat4.rotate(pitchRotationMatrix, pitchRotationMatrix, shipInstance.pitch * timeDelta, shipInstance.rightOrientation)

  vec3.transformMat4(shipInstance.roofOrientation, shipInstance.roofOrientation, rollRotationMatrix)
  vec3.transformMat4(shipInstance.rightOrientation, shipInstance.rightOrientation, rollRotationMatrix)

  vec3.transformMat4(shipInstance.noseOrientation, shipInstance.noseOrientation, pitchRotationMatrix)
  vec3.transformMat4(shipInstance.roofOrientation, shipInstance.roofOrientation, pitchRotationMatrix)

  vec3.normalize(shipInstance.noseOrientation, shipInstance.noseOrientation)
  vec3.normalize(shipInstance.roofOrientation, shipInstance.roofOrientation)
  vec3.normalize(shipInstance.rightOrientation, shipInstance.rightOrientation)

  // we also need to rotate our bounding box
  shipInstance.boundingBox = shipInstance.boundingBox.map((v) => {
    const newVector = vec3.transformMat4(vec3.create(), v, rollRotationMatrix)
    vec3.transformMat4(newVector, newVector, pitchRotationMatrix)
    return newVector
  })
}
