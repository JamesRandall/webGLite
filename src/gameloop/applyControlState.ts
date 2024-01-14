import {Player} from "../model/player";
import {Game} from "../model/game";
import {move} from "./utilities/transforms";
import {vec2, vec3} from "gl-matrix";
import {getNearestSystemToCursor} from "./utilities/map";
import {createDockingComputer} from "./utilities/dockingComputer";
import {Resources} from "../resources/resources";

export function applyControlState(game: Game, resources: Resources, timeDelta: number) {
    const player = game.player
    if (!player.isDocked) {
        if (!applyDockingComputer(game, resources, timeDelta)) {
            applyRoll(player, timeDelta)
            applyPitch(player, timeDelta)
            applyAcceleration(player, timeDelta)
            applyJump(game)
            applyHyperspace(game)
        }
    }

    if (game.hyperspace === null) {
        applyCursors(player, timeDelta)
    }
}

function applyDockingComputer(game: Game, resources: Resources, timeDelta: number) {
    if (game.player.dockingComputerFlightExecuter === null && game.player.controlState.dockingOn && !game.player.previousControlState.dockingOn) {
        game.player.dockingComputerFlightExecuter = createDockingComputer(game)
    }
    else if (game.player.dockingComputerFlightExecuter !== null && game.player.controlState.dockingOff) {
        game.player.dockingComputerFlightExecuter = null
    }
    if (!game.player.dockingComputerFlightExecuter) { return false }

    game.player.dockingComputerFlightExecuter(game, timeDelta)

    return true
}

function applyHyperspace(game: Game) {
    if (game.player.controlState.hyperspace) {
        game.player.controlState.hyperspace = false
        if (game.hyperspace === null) {
            const selectedSystem = getNearestSystemToCursor(game)
            game.player.selectedSystem = selectedSystem
            if (selectedSystem !== game.currentSystem) {
                const distance = vec2.length(vec2.subtract(vec2.create(), game.player.selectedSystem.galacticPosition, game.currentSystem.galacticPosition))
                if (distance * 10 <= game.player.fuel) {
                    game.hyperspace = {
                        rotation: 0,
                        countdown: 15,
                        outboundRadii: [],
                        inboundRadii: []
                    }
                }
            }
        }
    }
}

function applyJump(game: Game) {
    if (game.player.controlState.jump) {
        const distance = vec3.length(game.localBubble.planet.position)
        move(game.localBubble.planet, [0, 0, (distance / 2)])
        move(game.localBubble.sun, [0, 0, (distance / 2)])
        game.player.controlState.jump = false
    }
}

function applyCursors(player: Player, timeDelta: number) {
    let xDelta = 0
    let yDelta = 0
    if (player.controlState.cursorLeft) {
        xDelta -= 10 * timeDelta
    }
    if (player.controlState.cursorRight) {
        xDelta += 10 * timeDelta
    }
    if (player.controlState.cursorUp) {
        yDelta -= 10 * timeDelta
    }
    if (player.controlState.cursorDown) {
        yDelta += 10 * timeDelta
    }
    vec2.add(player.scannerCursor, player.scannerCursor, [xDelta, yDelta])
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
    } else if (player.roll > 0 && !player.disableDamping) {
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
    } else if (player.roll < 0 && !player.disableDamping) {
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
    } else if (player.pitch > 0 && !player.disableDamping) {
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
    } else if (player.pitch < 0 && !player.disableDamping) {
        player.pitch += player.ship.pitchDeceleration * timeDelta
        if (player.pitch > 0) {
            player.pitch = 0
        }
    }
}