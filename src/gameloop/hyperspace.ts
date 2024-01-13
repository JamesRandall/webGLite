import {Game, SceneEnum} from "../model/game";
import {StarSystem} from "../model/starSystem";
import {LocalBubble} from "../model/localBubble";
import {Resources} from "../resources/resources";
import {updateGameOnLaunch} from "./utilities/updateGameOnLaunch";
import {updateGameOnHyperspace} from "./utilities/updateGameOnHyperspace";

export function createHyperspaceLoop(game: Game, resources: Resources, onComplete: () => void) {
    let now = 0
    let rotationTime = 0
    let outboundMultiplier = 1
    let inboundOffset = 0
    const offsets = [
        1/32.0,
        1/16.0,
        1/8.0,
        1/4.0,
        1/2.0,
        1,
        1.5
    ]

    // A bit rough and ready but an approximation of the launch tunnel from the original
    return function updateHyperspace(deltaTime:number) {
        if (game.hyperspace === null) {
            return
        }
        //if (now === 0) {
        //    game.hyperspace.outboundRadii = [...offsets].sort((a:number,b:number) => b-a)
        //}

        now += deltaTime
        rotationTime += deltaTime
        if (rotationTime > 0.1) {
            rotationTime = 0
            game.hyperspace.rotation++
        }
        if (outboundMultiplier < 8) {
            if (now > 0.1) {
                for (let index = 1; index < offsets.length; index++) {
                    const delta = ((offsets[index] - offsets[index - 1]) / 8.0) * outboundMultiplier
                    game.hyperspace.outboundRadii.push(offsets[index - 1] + delta)
                }
                now = 0
                outboundMultiplier++
                game.hyperspace.outboundRadii = game.hyperspace.outboundRadii.sort((a: number, b: number) => b - a)
            }
        }
        else if (outboundMultiplier === 8) {
            if (now > 0.1) {
                now = 0
                if (inboundOffset < offsets.length-1) {
                    game.hyperspace.inboundRadii.push(offsets[inboundOffset])
                    inboundOffset++
                }
                else {
                    // we've finished launching so update the local bubble and set the scene to the front view
                    updateGameOnHyperspace(game, resources)
                    game.currentScene = SceneEnum.Front
                    onComplete()
                }
            }
        }
    }
}
