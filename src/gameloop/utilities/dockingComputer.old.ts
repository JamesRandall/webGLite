import {Game} from "../../model/game";
import {ShipInstance, ShipRoleEnum} from "../../model/ShipInstance";
import {vec3} from "gl-matrix";
import {radiansToDegrees} from "./transforms";
import {shipScaleFactor} from "../../constants";
import {Resources} from "../../resources/resources";

function decelerateToZero(game: Game, timeDelta: number) {
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

function moveToPosition(game: Game, targetPosition: vec3, timeDelta: number) {
    const distance = vec3.length(targetPosition)
    if (distance > 1) {
        game.player.speed = distance < 5 ? game.player.ship.maxSpeed/4 : game.player.ship.maxSpeed
        if (distance < 50) {
            rollAndPitchToFacePosition(targetPosition, game, timeDelta)
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

    return game.player.speed === 0
}

function lowPassFilter(rawValue: number, previousFilteredValue: number, alpha: number) {
    return alpha * rawValue + (1-alpha)*previousFilteredValue
}


// TODO: I need a two stage version of this that rolls and then pitches (or pitches and then rolls)
// TODO: I need to revisit the below and really tidy it up. I went on a bit of a crazy hunt and pulled things all over
// the place until I realised the issues I were dealing with weren't issues with logic but the precision issues
// documented within the method.
// TODO: scope these properly
let previousPitch = 0
let previousRoll = 0
function rollAndPitchToFacePosition(targetPosition: [number, number, number] | Float32Array, game: Game, timeDelta: number) {
    let pitchAngle = 0
    let rollAngle = 0
    const distance = vec3.length(targetPosition)
    const invertedPosition = vec3.multiply(vec3.create(), targetPosition, [-1, -1, -1])
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
    if (!(facingTowards && rollDotProduct === 0)) {
        const rollDirection = rollDotProduct * pitchAngle >= 0 ? 1 : -1
        if (Math.abs(rollDotProduct) < 0.200) {
            rollAngle = game.player.ship.maxRollSpeed/2
        }
        else {
            rollAngle = game.player.ship.maxRollSpeed/2
        }
        rollAngle *= rollDirection
    }

    pitchAngle = lowPassFilter(pitchAngle, previousPitch, 0.1)
    rollAngle = lowPassFilter(rollAngle, previousRoll, 0.1)
    previousPitch = pitchAngle
    previousRoll = rollAngle

    game.diagnostics.push(`PA: ${radiansToDegrees(pitchAngle)}`)
    game.diagnostics.push(`RA: ${radiansToDegrees(rollAngle)}`)
    game.diagnostics.push(`RDP: ${rollDotProduct}`)
    game.diagnostics.push(`FDP: ${facingTowardsDotProduct}`)
    game.diagnostics.push(`PDP: ${pitchDotProduct}`)
    game.diagnostics.push(`D: ${distance}`)

    if (facingTowards &&
    //distance > 100 ? Math.abs(facingTowardsDotProduct) === 1 : Math.abs(pitchAngle) < 0.0002 && Math.abs(rollDotProduct) < 0.1
        ((distance > 100 && facingTowardsDotProduct <= -0.9999) ||
        (distance <= 100 && Math.abs(pitchDotProduct) < 0.05 && Math.abs(rollDotProduct) < 0.05)))
    {
        game.player.pitch = 0
        game.player.roll = 0
        return true
    }

    game.player.pitch = pitchAngle
    game.player.roll = rollAngle
    return false
}

function matchRotation(game: Game, station: ShipInstance) {
    const dotProduct = vec3.dot([1,0,0], station.roofOrientation)
    game.diagnostics.push(`DP: ${dotProduct}`)
    if (Math.abs(dotProduct) > 0.99) {
        game.player.roll = -station.roll
        return true
    }
    game.player.roll = station.roll/2
    return false
}

export function createDockingComputerOld(game: Game, resources: Resources) {
    enum DockingStageEnum {
        Decelerating,
        RotatingToFront,
        MovingToFront,
        RotatingToFace,
        MatchRotation,
        Dock
    }
    const station = game.localBubble.station
    if (!station) return null

    let stage = DockingStageEnum.Decelerating

    // TODO: I need to add a stage in here to deal with going round the station if necessary (rather than through as we
    // do now!). That said the original game could crash into the station if the docking computer is triggered at
    // the wrong point.
    return function (game:Game, timeDelta: number) {
        const frontDistance = 160*shipScaleFactor*3
        game.diagnostics = []

        if (stage === DockingStageEnum.Decelerating) {
            if (decelerateToZero(game,timeDelta)) {
                stage = DockingStageEnum.RotatingToFront
            }
        }
        else if (stage === DockingStageEnum.RotatingToFront) {
            const delta = vec3.multiply(vec3.create(), station.noseOrientation, [frontDistance,frontDistance,frontDistance])
            const targetPosition = vec3.add(vec3.create(), station.position, delta)

            // The below can be useful when debugging the docking computer as it will place a Cobra at the target position
            //const cobra = resources.ships.getCobraMk3(targetPosition,[0,0,-1])
            //game.localBubble.ships.push(cobra)
            if (rollAndPitchToFacePosition(targetPosition, game, timeDelta)) {
                stage = DockingStageEnum.MovingToFront
            }
        }
        else if (stage === DockingStageEnum.MovingToFront) {
            const delta = vec3.multiply(vec3.create(), station.noseOrientation, [frontDistance,frontDistance,frontDistance])
            const targetPosition = vec3.add(vec3.create(), station.position, delta)

            if (moveToPosition(game, targetPosition, timeDelta)) {
                stage = DockingStageEnum.RotatingToFace
            }
        }
        else if (stage === DockingStageEnum.RotatingToFace) {
            const delta = vec3.multiply(vec3.create(), station.noseOrientation, [0,0,160*shipScaleFactor])
            const targetPosition = vec3.add(vec3.create(), station.position, delta)
            if (rollAndPitchToFacePosition(targetPosition, game, timeDelta)) {
                stage = DockingStageEnum.MatchRotation
            }
        }
        else if (stage === DockingStageEnum.MatchRotation) {
            if (matchRotation(game, station)) {
                stage = DockingStageEnum.Dock
            }
            //game.player.roll = -station.roll
        }
        else if (stage == DockingStageEnum.Dock) {
            game.player.speed = game.player.ship.maxSpeed/8
        }
    }
}
