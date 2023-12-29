import {Game} from "../../model/game";
import {Resources} from "../../resources/resources";
import {vec2} from "gl-matrix";

export function updateGameOnHyperspace(game:Game, resources:Resources) {
    const distance = vec2.distance(game.player.currentSystem.galacticPosition, game.player.selectedSystem.galacticPosition)
    game.player.fuel = Math.max(0, game.player.fuel - Math.floor(distance*10))
    game.hyperspace = null
    game.player.currentSystem = game.player.selectedSystem
}

