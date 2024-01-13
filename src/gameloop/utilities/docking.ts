import {Game, SceneEnum} from "../../model/game";
import {vec2, vec3} from "gl-matrix";
import {stationScaleFactor} from "../../constants";
import {calculateRoll, radiansToDegrees} from "./transforms";
import {ShipRoleEnum} from "../../model/ShipInstance";

export function updateGameOnDocked(game:Game) {
    game.player.isDocked = true
    game.player.dockingComputerFlightExecuter = null
    game.player.speed = 0
    game.player.roll = 0
    game.player.pitch = 0
    // remove all ships but the station from the local bubble
    game.localBubble.ships = game.localBubble.ships.filter(s => s.role === ShipRoleEnum.Station)
    game.currentScene = SceneEnum.PlayerDetails
}

export function isValidDocking(game:Game) {
    if (game.localBubble.station === null) return false
    const station = game.localBubble.station

    const gatePosition = vec3.add(
        vec3.create(),
        game.localBubble.station.position,
        vec3.multiply(vec3.create(), game.localBubble.station.noseOrientation, [0,0,game.localBubble.station.blueprint.model.boundingBoxSize[2]/2]))
    const gateDistance = vec3.length(gatePosition)
    if (gateDistance < 2) {
        const gateTopLeft = vec2.multiply(vec2.create(), vec2.fromValues(-30, -10), [stationScaleFactor,stationScaleFactor])
        const gateBottomRight = vec2.multiply(vec2.create(), vec2.fromValues(30, 10), [stationScaleFactor,stationScaleFactor])

        const roughPitchToStation = Math.asin(game.localBubble.station.position[1] / vec2.length([game.localBubble.station.position[2], game.localBubble.station.position[1]]))
        const roughPitchToStationDegrees = Math.abs(radiansToDegrees(roughPitchToStation))
        //const pitchAngleRadians = calculatePitch(game.localBubble.station)
        const roughPitchAngleDegrees = radiansToDegrees(roughPitchToStation)
        if (roughPitchToStationDegrees <= 20) {
            const stationRollRadians = calculateRoll(station)
            const stationRollDegrees = radiansToDegrees(stationRollRadians)

            if (stationRollDegrees >= 70 && stationRollDegrees <= 110) {
                // we've collided and so we're basically sat on the surface so if we adjust the player position to be relative
                // to the station position (ignoring Z as we're on the surface of the station) and rotate the position by the
                // stations roll then we can check the player against the horizontal gate
                // this is just a bit easier than checking if a point is inside a rotated rectangle - which would be the more
                // obvious way to do this
                const playerPositionRelativeToStationXY =
                    vec2.rotate(vec2.create(), [station.position[0], station.position[1]], [0,0], stationRollRadians)
                if (playerPositionRelativeToStationXY[0] > gateTopLeft[0] &&
                    playerPositionRelativeToStationXY[1] > gateTopLeft[1] &&
                    playerPositionRelativeToStationXY[0] < gateBottomRight[0] &&
                    playerPositionRelativeToStationXY[1] < gateBottomRight[1]
                ) {
                    return true
                }
            }
        }
    }
    return false
}