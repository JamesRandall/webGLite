import {Game, SceneEnum} from "../model/game";
import {StarSystem} from "../model/starSystem";
import {LocalBubble} from "../model/localBubble";
import {Resources} from "../resources/resources";

export function createLaunchingLoop(game: Game, resources: Resources) {
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
                    // we've finished launching
                    game.localBubble = createLocalBubbleOnLaunch(resources, game)
                    game.player.isDocked = false
                    game.player.speed = game.player.ship.maxSpeed * 0.25
                    //game.player.roll = Math.PI/2
                    game.currentScene = SceneEnum.Front
                }
            }
        }
    }
}

function createLocalBubbleOnLaunch(resources: Resources, game: Game) : LocalBubble {
    const station = resources.ships.getCoriolis([0,0,250], [0,0,-1])
    station.roll = Math.PI/4
    return {
        ...game.localBubble,
        ships: [ station ]
    }
}