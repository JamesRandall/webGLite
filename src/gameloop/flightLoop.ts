import {updateShipInstance} from "./updateShipInstance";
import {updateStardust} from "./stardust";
import {applyControlState} from "./applyControlState";
import {updateOrbitalBodies} from "./orbitalBody";
import {Game} from "../model/game";
import {isShipCollidingWithPlayer} from "./utilities/collisions";

export function flightLoop(game: Game, timeDelta:number) {
    game.localBubble.ships.forEach(ship => {
        updateShipInstance(ship, game.player, timeDelta)
    })
    updateOrbitalBodies(game, timeDelta)
    updateStardust(game, timeDelta)
    handleCollisions(game)
}

function handleCollisions(game: Game) {
    game.localBubble.ships.forEach(ship => {
        if (isShipCollidingWithPlayer(ship)) {
            game.diagnostics.push(`COLLISION - ${ship.blueprint.name}`)
        }
    })
}