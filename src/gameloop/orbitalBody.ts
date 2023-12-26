import {Player} from "../model/player";
import {vec3} from "gl-matrix";
import {OrbitalBody} from "../model/localBubble";
import {Game} from "../model/game";

export function updateOrbitalBodies(game: Game, timeDelta: number) {
    rotateLocationInSpaceByPlayerPitchAndRoll(game.localBubble.sun, game.player, timeDelta)
    rotateOrientationVectorsAccordingToPlayerPitchAndRoll(game.localBubble.sun, game.player, timeDelta)
    rotateLocationInSpaceByPlayerPitchAndRoll(game.localBubble.planet, game.player, timeDelta)
}

function rotateLocationInSpaceByPlayerPitchAndRoll(body: OrbitalBody, player: Player, timeDelta:number) {
    vec3.rotateZ(body.position, body.position, [0,0,0], player.roll * timeDelta)
    vec3.rotateX(body.position, body.position, [0,0,0], player.pitch * timeDelta)
}


function rotateOrientationVectorsAccordingToPlayerPitchAndRoll(shipInstance: OrbitalBody, player: Player, timeDelta:number) {
    vec3.rotateZ(shipInstance.orientation, shipInstance.orientation, [0,0,0], player.roll * timeDelta)
    vec3.rotateZ(shipInstance.upOrientation, shipInstance.upOrientation, [0,0,0], player.roll * timeDelta)
    vec3.rotateX(shipInstance.orientation, shipInstance.orientation, [0,0,0], player.pitch * timeDelta)
    vec3.rotateX(shipInstance.upOrientation, shipInstance.upOrientation, [0,0,0], player.pitch * timeDelta)
}
