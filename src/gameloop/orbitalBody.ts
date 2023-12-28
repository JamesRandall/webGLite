import {Player} from "../model/player";
import {vec3} from "gl-matrix";
import {OrbitalBody} from "../model/localBubble";
import {Game} from "../model/game";
import {ShipInstance} from "../model/ShipInstance";
import {worldToScannerViewRatio} from "../constants";
import {rotateOrientationVectorsByPitchAndRoll} from "./utilities/transforms";

export function updateOrbitalBodies(game: Game, timeDelta: number) {
    rotateLocationInSpaceByPlayerPitchAndRoll(game.localBubble.sun, game.player, timeDelta)
    rotateLocationInSpaceByPlayerPitchAndRoll(game.localBubble.planet, game.player, timeDelta)
    rotateOrientationVectorsAccordingToPlayerPitchAndRoll(game.localBubble.sun, game.player, timeDelta)
    rotateOrientationVectorsAccordingToPlayerPitchAndRoll(game.localBubble.planet, game.player, timeDelta)
    moveBodyByPlayerSpeed(game.localBubble.planet, game.player, timeDelta)
    moveBodyByPlayerSpeed(game.localBubble.sun, game.player, timeDelta)
}

function moveBodyByPlayerSpeed(body: OrbitalBody, player: Player, timeDelta:number) {
    // We move relative to planets slower than we move relative to other ships - otherwise we can crash into planets
    // very easily!
    // This might need a bit of playing with when we start moving into the safe zone and spawn a space station
    // (if we don't manage the stage very carefully we'll end up with the space station looking miles away from the
    // planet - one solution might be to spawn it at a range that accounts for the differing relative velocities)
    const playerOrbitalBodyRelativeSpeedFudgeFactor = 2
    vec3.add(body.position, body.position,[0,0,player.speed*timeDelta*playerOrbitalBodyRelativeSpeedFudgeFactor])
}

function rotateLocationInSpaceByPlayerPitchAndRoll(body: OrbitalBody, player: Player, timeDelta:number) {
    vec3.rotateZ(body.position, body.position, [0,0,0], player.roll * timeDelta)
    vec3.rotateX(body.position, body.position, [0,0,0], player.pitch * timeDelta)
}

function rotateOrientationVectorsAccordingToPlayerPitchAndRoll(body: OrbitalBody, player: Player, timeDelta:number) {
    rotateOrientationVectorsByPitchAndRoll(body, player.roll*timeDelta, player.pitch*timeDelta)
}
