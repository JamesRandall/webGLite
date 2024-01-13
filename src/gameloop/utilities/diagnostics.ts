import {Game} from "../../model/game";
import {vec2, vec3} from "gl-matrix";
import {calculateRoll, calculateRotation, radiansToDegrees} from "./transforms";

export function stationAngles(game:Game) {
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

export function stationPitchAndRoll(game:Game) {
    if (game.localBubble.station !== null) {
        const rollAngleRadians = calculateRoll(game.localBubble.station)
        const rollAngleDegrees = radiansToDegrees(rollAngleRadians)
        game.diagnostics.push(`SR: ${rollAngleDegrees}`)
        const roughPitchToStation = Math.asin(
            game.localBubble.station.position[1] / vec2.length([game.localBubble.station.position[2],
                game.localBubble.station.position[1]])
        )
        const roughPitchAngleDegrees = radiansToDegrees(roughPitchToStation)
        game.diagnostics.push(`SP: ${roughPitchAngleDegrees}`)
        const gatePosition = vec3.add(
            vec3.create(),
            game.localBubble.station.position,
            vec3.multiply(vec3.create(), game.localBubble.station.noseOrientation, [0,0,30])
        )
        const distance = vec3.length(gatePosition)
        game.diagnostics.push(`D: ${distance}`)
    }
}