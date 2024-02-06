import { Game, SceneEnum } from "../../model/game"
import { vec2, vec3 } from "gl-matrix"
import { dockingRollToleranceDegrees, stationScaleFactor } from "../../constants"
import { calculateRoll, radiansToDegrees } from "./transforms"
import { ShipRoleEnum } from "../../model/ShipInstance"
import { isInRotatedBox } from "./collisions"

export function updateGameOnDocked(game: Game) {
  game.player.isDocked = true
  game.player.dockingComputerFlightExecuter = null
  game.player.speed = 0
  game.player.roll = 0
  game.player.pitch = 0
  // remove all ships but the station from the local bubble
  game.localBubble.ships = game.localBubble.ships.filter((s) => s.role === ShipRoleEnum.Station)
  game.currentScene = SceneEnum.PlayerDetails
}

export function isValidDocking(game: Game) {
  if (game.localBubble.station === null) return false
  const station = game.localBubble.station

  const stationHalfSize = game.localBubble.station.blueprint.renderingModel.boundingBoxSize[2] / 2
  const gatePosition = vec3.add(
    vec3.create(),
    game.localBubble.station.position,
    vec3.multiply(vec3.create(), game.localBubble.station.noseOrientation, [
      stationHalfSize,
      stationHalfSize,
      stationHalfSize,
    ]),
  )
  const dockingBox = vec3.multiply(
    vec3.create(),
    // we just need a big number for Z as the check below is a 3d check, that we're here means we're already colliding
    // but theres a danger unless the gate is deep that depending on the collision we might not quite be in the depth at
    // the position of the gate
    [20, 60, 8],
    [stationScaleFactor, stationScaleFactor, stationScaleFactor],
  )
  console.log(`GP: [${gatePosition[0]},${gatePosition[1]},${gatePosition[2]}]`)
  console.log(`DB: [${dockingBox[0]},${dockingBox[1]},${dockingBox[2]}]`)

  if (
    isInRotatedBox(gatePosition, station.noseOrientation, station.roofOrientation, station.rightOrientation, dockingBox)
  ) {
    const roughPitchToStation = Math.asin(
      game.localBubble.station.position[1] /
        vec2.length([game.localBubble.station.position[2], game.localBubble.station.position[1]]),
    )
    const roughPitchToStationDegrees = Math.abs(radiansToDegrees(roughPitchToStation))
    console.log(`GATE PITCH: ${roughPitchToStationDegrees}`)
    if (roughPitchToStationDegrees <= 20) {
      const stationRollRadians = calculateRoll(station)
      const stationRollDegrees = radiansToDegrees(stationRollRadians)
      console.log(`GATE ROLL: ${stationRollDegrees}`)
      if (
        stationRollDegrees >= 90 - dockingRollToleranceDegrees &&
        stationRollDegrees <= 90 + dockingRollToleranceDegrees
      ) {
        return true
      }
    }
  }
  return false
}
