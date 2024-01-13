import {Game} from "../../model/game";
import {vec3} from "gl-matrix";
import {shipScaleFactor} from "../../constants";
import {ShipInstance} from "../../model/ShipInstance";

function immediateAllStop(game: Game, _:vec3, timeDelta: number) {
    game.player.speed = 0
    game.player.roll = 0
    game.player.pitch = 0
    return true
}

function accelerateToOneThird(game: Game, _:vec3, timeDelta: number) {
    const oneThirdSpeed = game.player.ship.maxSpeed / 3
    if (game.player.speed < oneThirdSpeed) {
        game.player.speed += game.player.ship.speedAcceleration * timeDelta
    }
    if (game.player.speed >= oneThirdSpeed) {
        game.player.speed = oneThirdSpeed
        return true
    }
    return false
}

function allStop(game: Game, _:vec3, timeDelta: number) {
    if (game.player.speed > 0) {
        game.player.speed -= game.player.ship.speedAcceleration * timeDelta
        if (game.player.speed <= 0) {
            game.player.speed = 0
        }
    }
    if (game.player.roll > 0) {
        game.player.roll -= game.player.ship.rollAcceleration * timeDelta
        if (game.player.roll < 0) {
            game.player.roll = 0
        }
    } else if (game.player.roll < 0) {
        game.player.roll += game.player.ship.rollAcceleration * timeDelta
        if (game.player.roll > 0) {
            game.player.roll = 0
        }
    }
    if (game.player.pitch > 0) {
        game.player.pitch -= game.player.ship.pitchAcceleration * timeDelta
        if (game.player.pitch < 0) {
            game.player.pitch = 0
        }
    } else if (game.player.pitch < 0) {
        game.player.pitch += game.player.ship.pitchAcceleration * timeDelta
        if (game.player.pitch > 0) {
            game.player.pitch = 0
        }
    }

    return game.player.speed === 0 && game.player.pitch === 0 && game.player.roll === 0
}


type FlightPlanPositionProvider = (game:Game) => vec3
type FlightPlanManeuverStage = (game:Game,context:vec3,timeDelta:number) => boolean
type FlightPlanActionStage = (game:Game,context:vec3) => void
type FlightPlanStage = FlightPlanPositionProvider | FlightPlanManeuverStage | FlightPlanActionStage

function isFlightPlanPositionProviderStage(func: Function): func is FlightPlanPositionProvider {
    return func.length === 1
}
function isFlightPlanManeuverStage(func:Function): func is FlightPlanManeuverStage {
    return func.length === 3
}
function isFlightPlanActionStage(func:Function): func is FlightPlanActionStage {
    return func.length === 2
}

export function executeFlightPlan(game:Game, stages:FlightPlanStage[]) {
    let currentStageIndex = 0
    let positionProvider:FlightPlanPositionProvider = (_:Game) => vec3.create()

    return function (game:Game, timeDelta:number) {
        if (currentStageIndex >= stages.length) return
        const stage = stages[currentStageIndex]
        if (isFlightPlanPositionProviderStage(stage)) {
            positionProvider = stage
            currentStageIndex++
        }
        else if (isFlightPlanManeuverStage(stage)) {
            const stageIsComplete = stage(game,positionProvider(game),timeDelta)
            if (stageIsComplete) {
                currentStageIndex++
            }
        }
        else if (isFlightPlanActionStage(stage)) {
            stage(game,positionProvider(game))
            currentStageIndex++
        }
    }
}

export function pitchToPoint(game:Game, context:vec3, timeDelta:number) {
    const tolerance = 0.005
    let pitchAngle = 0
    const invertedPosition = vec3.multiply(vec3.create(), context, [-1, -1, -1])
    const normalisedTarget = vec3.normalize(vec3.create(), invertedPosition)

    /// TODO: generalise this as we'll need it elsewhere
    // This is quite funny. Everything was working when I was at my desk plugged into 60Hz monitors - game locked to 60fps. But in the afternoon
    // I retired to the sofa where I was just using my laptop which runs at 120Hz - game locked to 120fps. With this
    // framerate we end up with precision issues - we end up with normalised vectors that have a length > 1 by
    // an infinitesimal amount (for example Z will be 1 but X and Y will be 0.0000000000001) but its just enough to
    // create havoc!
    // Made me chuckle because the original game has to clean up number inaccuracies too.
    if (normalisedTarget[2] === 1 || normalisedTarget[2] === -1) {
        normalisedTarget[0] = 0
        normalisedTarget[1] = 0
    }

    const facingTowardsDotProduct = vec3.dot([0, 0, -1], normalisedTarget)
    const facingTowards = facingTowardsDotProduct < 0

    const pitchDotProduct = vec3.dot([0, 1, 0], normalisedTarget)
    const remainingPitchAngle = Math.acos(pitchDotProduct) - Math.PI / 2

    if (facingTowards && Math.abs(pitchDotProduct) < tolerance) {
        pitchAngle = 0
    } else if (pitchDotProduct < 0) {
        pitchAngle = facingTowards ? Math.max(-Math.abs(remainingPitchAngle / timeDelta), -game.player.ship.maxPitchSpeed) : -game.player.ship.maxPitchSpeed
    } else {
        pitchAngle = facingTowards ? Math.min(Math.abs(remainingPitchAngle / timeDelta), game.player.ship.maxPitchSpeed) : game.player.ship.maxPitchSpeed
    }

    game.player.pitch = pitchAngle
    //game.diagnostics.push(`PDP: ${pitchDotProduct}`)

    return facingTowards && Math.abs(pitchDotProduct) < tolerance
}

export function rollToPoint(game:Game, context:vec3, timeDelta:number) {
    const tolerance = 0.005
    let rollAngle = 0
    let pitchAngle = 0
    const invertedPosition = vec3.multiply(vec3.create(), context, [-1, -1, -1])
    const normalisedTarget = vec3.normalize(vec3.create(), invertedPosition)

    /// TODO: generalise this as we'll need it elsewhere
    // This is quite funny. Everything was working when I was at my desk plugged into 60Hz monitors - game locked to 60fps. But in the afternoon
    // I retired to the sofa where I was just using my laptop which runs at 120Hz - game locked to 120fps. With this
    // framerate we end up with precision issues - we end up with normalised vectors that have a length > 1 by
    // an infinitesimal amount (for example Z will be 1 but X and Y will be 0.0000000000001) but its just enough to
    // create havoc!
    // Made me chuckle because the original game has to clean up number inaccuracies too.
    if (normalisedTarget[2] === 1 || normalisedTarget[2] === -1) {
        normalisedTarget[0] = 0
        normalisedTarget[1] = 0
    }

    const facingTowardsDotProduct = vec3.dot([0,0,-1], normalisedTarget)
    const facingTowards = facingTowardsDotProduct < 0

    const pitchDotProduct = vec3.dot([0, 1, 0], normalisedTarget)
    const remainingPitchAngle = Math.acos(pitchDotProduct) - Math.PI / 2

    if (facingTowards && pitchDotProduct === 0) {
        pitchAngle = 0
    } else if (pitchDotProduct < 0) {
        pitchAngle = facingTowards ? Math.max(-Math.abs(remainingPitchAngle / timeDelta), -game.player.ship.maxPitchSpeed) : -game.player.ship.maxPitchSpeed
    } else {
        pitchAngle = facingTowards ? Math.min(Math.abs(remainingPitchAngle / timeDelta), game.player.ship.maxPitchSpeed) : game.player.ship.maxPitchSpeed
    }

    const rollDotProduct = vec3.dot([1, 0, 0], normalisedTarget)
    //const remainingAngle = Math.acos(rollDotProduct) //normalisedTarget[1] === 0 ? 0 : Math.atan(normalisedTarget[0] / normalisedTarget[1])
    if (Math.abs(rollDotProduct) < tolerance) {
        rollAngle = 0
    }
    else {
        const rollDirection = rollDotProduct * pitchAngle >= 0 ? 1 : -1
        if (Math.abs(rollDotProduct) < 0.200) {
            rollAngle = game.player.ship.maxRollSpeed/2
        }
        else {
            rollAngle = game.player.ship.maxRollSpeed/2
        }
        rollAngle *= rollDirection
    }
    game.player.roll = rollAngle

    game.diagnostics.push(`RDP: ${rollDotProduct}`)

    return Math.abs(rollDotProduct) < tolerance
}

export function moveToPoint(game:Game, position:vec3, timeDelta:number) {
    const distance = vec3.length(position)
    if (distance > 2) {
        game.player.speed = distance < 5 ? game.player.ship.maxSpeed/4 : game.player.ship.maxSpeed
        if (distance < 100) {
            //rollAndPitchToFacePosition(position, game, timeDelta)
        }
        else {
            game.player.pitch = 0
            game.player.roll = 0
        }
    }
    else {
        game.player.speed = 0
        game.player.pitch = 0
        game.player.roll = 0
    }

    game.diagnostics.push(`D: ${distance}`)

    return game.player.speed === 0
}

function matchRotation(game: Game, ship: ShipInstance) {
    const dotProduct = vec3.dot([1,0,0], ship.roofOrientation)
    game.diagnostics.push(`DP: ${dotProduct}`)
    if (Math.abs(dotProduct) > 0.99) {
        game.player.roll = -ship.roll
        return true
    }
    game.player.roll = ship.roll/2
    return false
}

export function createDockingComputer(game:Game) {
    // the ship seems to be rolling and pitching at the same time but with the logic below it shouldnt

    const frontDistance = 160*shipScaleFactor*6
    let station = game.localBubble.station!

    const matchRotationToStation = (game:Game) => matchRotation(game, station)

    const setToFrontPoint = (_:Game) =>
        vec3.add(
            vec3.create(),
            station.position,
            vec3.multiply(vec3.create(), station.noseOrientation, [frontDistance,frontDistance,frontDistance]))
    const setToDockingPort = (_:Game) =>
        station.position

    return executeFlightPlan(game, [
        allStop,
        setToFrontPoint,
        rollToPoint,
        pitchToPoint,
        rollToPoint,
        pitchToPoint,
        moveToPoint,
        immediateAllStop,
        setToDockingPort,
        rollToPoint,
        pitchToPoint,
        rollToPoint,
        pitchToPoint,
        matchRotationToStation,
        accelerateToOneThird
    ])
}