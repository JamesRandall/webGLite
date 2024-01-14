import {Game} from "../../model/game";
import {vec3} from "gl-matrix";
import {ShipInstance} from "../../model/ShipInstance";
import {calculateRoll, radiansToDegrees} from "./transforms";
import {dockingRollToleranceDegrees} from "../../constants";

export function rollToPoint(game:Game, context:vec3, timeDelta:number) {
    const tolerance = 0.002
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
    const absRollDotProduct = Math.abs(rollDotProduct)
    const rollAngleRemainingRadians = Math.abs(Math.acos(rollDotProduct) - Math.PI/2)
    const rollDirection = rollDotProduct * pitchAngle >= 0 ? 1 : -1
    if (absRollDotProduct < tolerance) {
        rollAngle = 0
    }
    else {
        rollAngle = Math.min(rollAngleRemainingRadians / timeDelta,game.player.ship.maxRollSpeed)
        rollAngle *= rollDirection
    }
    game.player.roll = rollAngle
    return rollAngle === 0
}

export function moveToPoint(game:Game, position:vec3, timeDelta:number) {
    // TODO: Because this relies on the orientation set at the start of this stage over long distances
    // it is not very accurate. We need to come back and make this refine its trajectory as it goes
    const distance = vec3.length(position)
    if (distance > 2) {
        game.player.speed = distance < 5 ? game.player.ship.maxSpeed/4 : game.player.ship.maxSpeed
        // This resolves the above inaccuracy but results in very "rolling" approach. I've not had it fail
        // but it looks weird to the player
        //rollToPoint(game, position, timeDelta)
        //pitchToPoint(game,position,timeDelta)
    }
    else {
        console.log(`DONE MOVE: ${distance}`)
        game.player.speed = 0
        game.player.pitch = 0
        game.player.roll = 0
    }

    //game.diagnostics.push(`D: ${distance}`)

    return game.player.speed === 0
}

export function matchRotation(game: Game, ship: ShipInstance) {
    const stationRollRadians = calculateRoll(ship)
    const stationRollDegrees = radiansToDegrees(stationRollRadians)

    //game.diagnostics.push(`SRD: ${stationRollDegrees}`)
    if (stationRollDegrees >= (90-dockingRollToleranceDegrees/2) && stationRollDegrees <= (90+dockingRollToleranceDegrees/2)) {
        game.player.roll = -ship.roll
        return true
    }
    game.player.roll = ship.roll/2
    return false
}

export function pitchToPoint(game:Game, context:vec3, timeDelta:number) {
    const tolerance = 0.00125
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

export function allStop(game: Game, _:vec3, timeDelta: number) {
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

export function immediateAllStop(game: Game, _:vec3, timeDelta: number) {
    game.player.speed = 0
    game.player.roll = 0
    game.player.pitch = 0
    return true
}

export function accelerateToOneThird(game: Game, _:vec3, timeDelta: number) {
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