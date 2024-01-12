import {updateShipInstance} from "./updateShipInstance";
import {updateStardust} from "./stardust";
import {updateOrbitalBodies} from "./orbitalBody";
import {Game, SceneEnum} from "../model/game";
import {isShipCollidingWithPlayer} from "./utilities/collisions";
import {ShipRoleEnum} from "../model/ShipInstance";
import {isValidDocking} from "./utilities/docking";

export function flightLoop(game: Game, timeDelta:number) {
    game.localBubble.ships.forEach(ship => {
        updateShipInstance(ship, game.player, timeDelta)
    })
    updateOrbitalBodies(game, timeDelta)
    updateStardust(game, timeDelta)
    handleCollisions(game)


    /*if (game.localBubble.station !== null) {
        const angleRadians = calculateRoll(game.localBubble.station)
        const angleDegrees = radiansToDegrees(angleRadians)
        game.diagnostics.push(`SA: ${angleDegrees}`)
    }*/

    //const invertedPosition = vec3.multiply(vec3.create(), game.localBubble.station!.position, [-1, -1, -1])
    //const normalisedTarget = vec3.normalize(vec3.create(), invertedPosition)
    //const rollDotProduct = vec3.dot([1, 0, 0], normalisedTarget)
    //game.diagnostics.push(`RDP: ${rollDotProduct}`)
}

function handleCollisions(game: Game) {
    game.localBubble.ships.forEach(ship => {
        if (isShipCollidingWithPlayer(ship)) {
            game.diagnostics.push(`COLLISION - ${ship.blueprint.name}`)
            if (ship.role === ShipRoleEnum.Station) {
                if (isValidDocking(game)) {
                    game.currentScene = SceneEnum.Docking
                }
                else {
                    game.currentScene = SceneEnum.PlayerExploding
                }
                return
            }
        }
    })
}