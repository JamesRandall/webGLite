import { Game } from "../../model/game"
import { vec2, vec3 } from "gl-matrix"
import { calculateRoll, calculateRotationForShip, radiansToDegrees } from "./transforms"

export function stationAngles(game: Game) {
  if (game.localBubble.station !== null) {
    const [noseAngleRadians, roofAngleRadians, sideAngleRadians] = calculateRotationForShip(game.localBubble.station)
    const noseAngle = radiansToDegrees(noseAngleRadians)
    const roofAngle = radiansToDegrees(roofAngleRadians)
    const sideAngle = radiansToDegrees(sideAngleRadians)
    game.diagnostics.push(`N: ${noseAngle}`)
    game.diagnostics.push(`R: ${roofAngle}`)
    game.diagnostics.push(`S: ${sideAngle}`)
    const gateDistance = game.localBubble.station.blueprint.renderingModel.boundingBoxSize[2] / 2
    const gatePosition = vec3.add(
      vec3.create(),
      game.localBubble.station.position,
      vec3.multiply(vec3.create(), game.localBubble.station.noseOrientation, [
        gateDistance,
        gateDistance,
        gateDistance,
      ]),
    )
    const distance = vec3.length(gatePosition)
    game.diagnostics.push(`D: ${distance}`)
  }
}

export function stationPitchAndRoll(game: Game) {
  if (game.localBubble.station !== null) {
    const rollAngleRadians = calculateRoll(game.localBubble.station)
    const rollAngleDegrees = radiansToDegrees(rollAngleRadians)
    game.diagnostics.push(`SR: ${rollAngleDegrees}`)
    const roughPitchToStation = Math.asin(
      game.localBubble.station.position[1] /
        vec2.length([game.localBubble.station.position[2], game.localBubble.station.position[1]]),
    )
    const roughPitchAngleDegrees = radiansToDegrees(roughPitchToStation)
    game.diagnostics.push(`SP: ${roughPitchAngleDegrees}`)
    const gateDistance = game.localBubble.station.blueprint.renderingModel.boundingBoxSize[2] / 2
    const gatePosition = vec3.add(
      vec3.create(),
      game.localBubble.station.position,
      vec3.multiply(vec3.create(), game.localBubble.station.noseOrientation, [
        gateDistance,
        gateDistance,
        gateDistance,
      ]),
    )
    const distance = vec3.length(gatePosition)
    game.diagnostics.push(`D: ${distance}`)
  }
}

export function stationDistance(game: Game) {
  if (game.localBubble.station !== null) {
    const distance = vec3.length(game.localBubble.station.position)
    game.diagnostics.push(`D: ${distance}`)
  }
  const planetDistance = vec3.length(game.localBubble.planet.position)
  game.diagnostics.push(`PD: ${planetDistance}`)
}
