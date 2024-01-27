import { Player } from "../model/player"
import { mat4, vec3 } from "gl-matrix"
import { OrbitalBody } from "../model/localBubble"
import { Game } from "../model/game"
import { calculatePlayerVelocity, rotateOrientationVectorsByPitchAndRoll } from "./utilities/transforms"
import { playerOrbitalBodyRelativeSpeedFudgeFactor } from "../constants"
import { ShipInstance } from "../model/ShipInstance"

// TODO: Now planets are spheres we need to consolidate this with updateShipInstance

export function updateOrbitalBodies(game: Game, timeDelta: number) {
  rotateLocationInSpaceByPlayerPitchAndRoll(game.localBubble.sun, game.player, timeDelta)
  rotateLocationInSpaceByPlayerPitchAndRoll(game.localBubble.planet, game.player, timeDelta)
  moveBodyByPlayerSpeed(game.localBubble.planet, game.player, timeDelta)
  moveBodyByPlayerSpeed(game.localBubble.sun, game.player, timeDelta)
  rotateOrientationVectorsAccordingToPlayerPitchAndRoll(game.localBubble.sun, game.player, timeDelta)
  rotateOrientationVectorsAccordingToPlayerPitchAndRoll(game.localBubble.planet, game.player, timeDelta)
  rotateBodyByPitchAndRoll(game.localBubble.planet, timeDelta)
}

function moveBodyByPlayerSpeed(body: OrbitalBody, player: Player, timeDelta: number) {
  const velocity = calculatePlayerVelocity(player, timeDelta)
  vec3.add(body.position, body.position, velocity)
}

function rotateLocationInSpaceByPlayerPitchAndRoll(body: OrbitalBody, player: Player, timeDelta: number) {
  vec3.rotateZ(body.position, body.position, [0, 0, 0], player.roll * timeDelta)
  vec3.rotateX(body.position, body.position, [0, 0, 0], player.pitch * timeDelta)
}

function rotateOrientationVectorsAccordingToPlayerPitchAndRoll(body: OrbitalBody, player: Player, timeDelta: number) {
  rotateOrientationVectorsByPitchAndRoll(body, player.roll * timeDelta, player.pitch * timeDelta)
}

function rotateBodyByPitchAndRoll(shipInstance: OrbitalBody, timeDelta: number) {
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
}
