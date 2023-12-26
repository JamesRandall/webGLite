import {Player} from "../model/player";

export function applyControlState(player: Player, timeDelta: number) {
    applyRoll(player, timeDelta)
    applyPitch(player, timeDelta)
    applyAcceleration(player, timeDelta)

    applyCursors(player, timeDelta)
}

function applyCursors(player: Player, timeDelta: number) {
    if (player.controlState.cursorLeft) {
        player.scannerCursor.x -= 10 * timeDelta
    }
    if (player.controlState.cursorRight) {
        player.scannerCursor.x += 10 * timeDelta
    }
    if (player.controlState.cursorUp) {
        player.scannerCursor.y -= 10 * timeDelta
    }
    if (player.controlState.cursorDown) {
        player.scannerCursor.y += 10 * timeDelta
    }
}

function applyAcceleration(player: Player, timeDelta: number) {
    if (player.controlState.accelerate) {
        player.speed += player.ship.speedAcceleration * timeDelta
        if (player.speed > player.ship.maxSpeed) {
            player.speed = player.ship.maxSpeed
        }
    }
    if (player.controlState.decelerate) {
        player.speed -= player.ship.speedAcceleration * timeDelta
        if (player.speed < 0.0) {
            player.speed = 0.0
        }
    }
}

function applyRoll(player: Player, timeDelta: number) {
    if (player.controlState.rollRight) {
        if (!player.previousControlState.rollRight && player.roll < 0) {
            player.roll = 0
        }
        else {
            player.roll += player.ship.rollAcceleration * timeDelta
            if (player.roll > player.ship.maxRollSpeed) {
                player.roll = player.ship.maxRollSpeed
            }
        }
    } else if (player.roll > 0) {
        player.roll -= player.ship.rollDeceleration * timeDelta
        if (player.roll < 0) {
            player.roll = 0
        }
    }

    if (player.controlState.rollLeft) {
        if (!player.previousControlState.rollLeft && player.roll > 0) {
            player.roll = 0
        }
        else {
            player.roll -= player.ship.rollAcceleration * timeDelta
            if (player.roll < -player.ship.maxRollSpeed) {
                player.roll = -player.ship.maxRollSpeed
            }
        }
    } else if (player.roll < 0) {
        player.roll += player.ship.rollDeceleration * timeDelta
        if (player.roll > 0) {
            player.roll = 0
        }
    }
}

function applyPitch(player: Player, timeDelta: number) {
    if (player.controlState.pitchDown) {
        if (!player.previousControlState.pitchDown && player.pitch < 0) {
            player.pitch = 0
        }
        else {
            player.pitch += player.ship.pitchAcceleration * timeDelta
            if (player.pitch > player.ship.maxPitchSpeed) {
                player.pitch = player.ship.maxPitchSpeed
            }
        }
    } else if (player.pitch > 0) {
        player.pitch -= player.ship.pitchDeceleration * timeDelta
        if (player.pitch < 0) {
            player.pitch = 0
        }
    }

    if (player.controlState.pitchUp) {
        if (!player.previousControlState.pitchUp && player.pitch > 0) {
            player.pitch = 0
        }
        else {
            player.pitch -= player.ship.pitchAcceleration * timeDelta
            if (player.pitch < -player.ship.maxPitchSpeed) {
                player.pitch = -player.ship.maxPitchSpeed
            }
        }
    } else if (player.pitch < 0) {
        player.pitch += player.ship.pitchDeceleration * timeDelta
        if (player.pitch > 0) {
            player.pitch = 0
        }
    }
}