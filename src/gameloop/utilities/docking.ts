import {Game, SceneEnum} from "../../model/game";
import {vec2} from "gl-matrix";
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

    const gateTopLeft = vec2.multiply(vec2.create(), vec2.fromValues(-30, -10), [stationScaleFactor,stationScaleFactor])
    const gateBottomRight = vec2.multiply(vec2.create(), vec2.fromValues(30, 10), [stationScaleFactor,stationScaleFactor])
    const stationRollRadians = calculateRoll(station)
    const stationRollDegrees = radiansToDegrees(stationRollRadians)

    if (stationRollDegrees > 69) {
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
    return false
}