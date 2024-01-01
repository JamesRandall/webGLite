import {updateShipInstance} from "./updateShipInstance";
import {updateStardust} from "./stardust";
import {applyControlState} from "./applyControlState";
import {updateOrbitalBodies} from "./orbitalBody";
import {Game} from "../model/game";

export function flightLoop(game: Game, timeDelta:number) {
    game.localBubble.ships.forEach(ship => {
        updateShipInstance(ship, game.player, timeDelta)
    })
    updateOrbitalBodies(game, timeDelta)
    updateStardust(game, timeDelta)


    //TODO: REMOVE THIS
    //if (game.player.controlState.dockingOn) game.player.roll = 0
}