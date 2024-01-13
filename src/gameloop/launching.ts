import {Game, SceneEnum} from "../model/game";
import {StarSystem} from "../model/starSystem";
import {LocalBubble} from "../model/localBubble";
import {Resources} from "../resources/resources";
import {updateGameOnLaunch} from "./utilities/updateGameOnLaunch";

export function createLaunchingLoop(game: Game, resources: Resources, onLaunched: () => void) {
    let now = 0
    let outboundMultiplier = 1
    let inboundOffset = 0
    const offsets = [
        1/32.0,
        1/16.0,
        1/8.0,
        1/4.0,
        1/2.0,
        1
    ]
    game.launching = null

    // A bit rough and ready but an approximation of the launch tunnel from the original
    return function updateLaunching(deltaTime:number) {
        if (game.launching === null) {
            game.launching = { inboundRadii: [], outboundRadii: [...offsets].sort((a:number,b:number) => b-a) }
        }

        now += deltaTime
        if (outboundMultiplier < 8) {
            if (now > 0.1) {
                for (let index = 1; index < offsets.length; index++) {
                    const delta = ((offsets[index] - offsets[index - 1]) / 8.0) * outboundMultiplier
                    game.launching.outboundRadii.push(offsets[index - 1] + delta)
                }
                now = 0
                outboundMultiplier++
                game.launching.outboundRadii = game.launching.outboundRadii.sort((a: number, b: number) => b - a)
            }
        }
        else if (outboundMultiplier === 8) {
            if (now > 0.1) {
                now = 0
                if (inboundOffset < offsets.length-1) {
                    game.launching.inboundRadii.push(offsets[inboundOffset])
                    inboundOffset++
                }
                else {
                    // we've finished launching so update the local bubble and set the scene to the front view
                    updateGameOnLaunch(game, resources)
                    game.currentScene = SceneEnum.Front
                    onLaunched()
                }
            }
        }
    }
}
