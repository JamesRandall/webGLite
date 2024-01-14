import {Game} from "../../model/game";
import {vec3} from "gl-matrix";
import {
    accelerateToOneThird,
    allStop,
    immediateAllStop,
    matchRotation,
    moveToPoint,
    pitchToPoint,
    rollToPoint
} from "./flightPlanActions";
import {executeFlightPlan} from "./flightPlan";

export function createDockingComputer(game:Game) {
    let station = game.localBubble.station!
    const frontDistance = station.blueprint.model.boundingBoxSize[2] * 2
    const gateDistance = station.blueprint.model.boundingBoxSize[2] / 2

    // The function signature is important as we use that to determine what to do with the response
    const matchRotationToStation = (game:Game,context:vec3,timeDelta:number) => matchRotation(game, station)

    const holdUntilDocked = (game:Game,context:vec3,timeDelta:number) => game.player.isDocked

    const setToFrontPoint = (_:Game) =>
        vec3.add(
            vec3.create(),
            station.position,
            vec3.multiply(vec3.create(), station.noseOrientation, [frontDistance,frontDistance,frontDistance]))
    const setToDockingPort = (_:Game) =>
        vec3.add(
            vec3.create(),
            station.position,
            vec3.multiply(vec3.create(), station.noseOrientation, [gateDistance, gateDistance, gateDistance])
        )

    return executeFlightPlan(game, [
        allStop,
        setToFrontPoint,
        rollToPoint,
        pitchToPoint,
        moveToPoint,
        immediateAllStop,
        setToDockingPort,
        rollToPoint,
        pitchToPoint,
        matchRotationToStation,
        accelerateToOneThird,
        holdUntilDocked
    ])
}