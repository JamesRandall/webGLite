import {updateShipInstance} from "./updateShipInstance";
import {updateStardust} from "./stardust";
import {updateOrbitalBodies} from "./orbitalBody";
import {Game, SceneEnum} from "../model/game";
import {isShipCollidingWithPlayer} from "./utilities/collisions";
import {ShipRoleEnum} from "../model/ShipInstance";
import {isValidDocking} from "./utilities/docking";
import {calculatePitch, calculateRoll, calculateRotation, radiansToDegrees} from "./utilities/transforms";
import {vec2, vec3} from "gl-matrix";
import {stationScaleFactor} from "../constants";

export function flightLoop(game: Game, timeDelta:number) {
    game.localBubble.ships.forEach(ship => {
        updateShipInstance(ship, game.player, timeDelta)
    })
    updateOrbitalBodies(game, timeDelta)
    updateStardust(game, timeDelta)
    handleCollisions(game)

    // Useful diagnostic when working on manual docking or with the docking computer
    /*if (game.localBubble.station !== null) {
        const rollAngleRadians = calculateRoll(game.localBubble.station)
        const rollAngleDegrees = radiansToDegrees(rollAngleRadians)
        game.diagnostics.push(`SR: ${rollAngleDegrees}`)
        const roughPitchToStation = Math.asin(game.localBubble.station.position[1] / vec2.length([game.localBubble.station.position[2], game.localBubble.station.position[1]]))
        const roughPitchAngleDegrees = radiansToDegrees(roughPitchToStation)
        game.diagnostics.push(`SP: ${roughPitchAngleDegrees}`)
        const gatePosition = vec3.add(
            vec3.create(),
            game.localBubble.station.position,
            vec3.multiply(vec3.create(), game.localBubble.station.noseOrientation, [0,0,30]))
        const distance = vec3.length(gatePosition)
        game.diagnostics.push(`D: ${distance}`)
    }*/

    // Another useful docking diagnostic
    if (game.localBubble.station !== null) {
        const [noseAngleRadians, roofAngleRadians, sideAngleRadians] = calculateRotation(game.localBubble.station)
        const noseAngle = radiansToDegrees(noseAngleRadians)
        const roofAngle = radiansToDegrees(roofAngleRadians)
        const sideAngle = radiansToDegrees(sideAngleRadians)
        game.diagnostics.push(`N: ${noseAngle}`)
        game.diagnostics.push(`R: ${roofAngle}`)
        game.diagnostics.push(`S: ${sideAngle}`)
        const gatePosition = vec3.add(
            vec3.create(),
            game.localBubble.station.position,
            vec3.multiply(vec3.create(), game.localBubble.station.noseOrientation, [0,0,game.localBubble.station.blueprint.model.boundingBoxSize[2]/2]))
        const distance = vec3.length(gatePosition)
        game.diagnostics.push(`D: ${distance}`)
    }
}

function handleCollisions(game: Game) {
    game.localBubble.ships.forEach(ship => {
        if (isShipCollidingWithPlayer(ship)) {
            game.diagnostics.push(`COLLISION - ${ship.blueprint.name}`)
            if (ship.role === ShipRoleEnum.Station) {
                if (isValidDocking(game)) {
                    game.currentScene = SceneEnum.Docking
                }
                else {
                    game.currentScene = SceneEnum.PlayerExploding
                }
                return
            }
        }
    })
}