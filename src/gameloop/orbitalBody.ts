import {Player} from "../model/player";
import {vec3} from "gl-matrix";
import {OrbitalBody} from "../model/localBubble";
import {Game} from "../model/game";
import {rotateOrientationVectorsByPitchAndRoll} from "./utilities/transforms";
import {playerOrbitalBodyRelativeSpeedFudgeFactor} from "../constants";

export function updateOrbitalBodies(game: Game, timeDelta: number) {
    rotateLocationInSpaceByPlayerPitchAndRoll(game.localBubble.sun, game.player, timeDelta)
    rotateLocationInSpaceByPlayerPitchAndRoll(game.localBubble.planet, game.player, timeDelta)
    rotateOrientationVectorsAccordingToPlayerPitchAndRoll(game.localBubble.sun, game.player, timeDelta)
    rotateOrientationVectorsAccordingToPlayerPitchAndRoll(game.localBubble.planet, game.player, timeDelta)
    moveBodyByPlayerSpeed(game.localBubble.planet, game.player, timeDelta)
    moveBodyByPlayerSpeed(game.localBubble.sun, game.player, timeDelta)
}

function moveBodyByPlayerSpeed(body: OrbitalBody, player: Player, timeDelta:number) {

    vec3.add(body.position, body.position,[0,0,player.speed*timeDelta*playerOrbitalBodyRelativeSpeedFudgeFactor])
}

function rotateLocationInSpaceByPlayerPitchAndRoll(body: OrbitalBody, player: Player, timeDelta:number) {
    vec3.rotateZ(body.position, body.position, [0,0,0], player.roll * timeDelta)
    vec3.rotateX(body.position, body.position, [0,0,0], player.pitch * timeDelta)
}

function rotateOrientationVectorsAccordingToPlayerPitchAndRoll(body: OrbitalBody, player: Player, timeDelta:number) {
    rotateOrientationVectorsByPitchAndRoll(body, player.roll*timeDelta, player.pitch*timeDelta)
}
