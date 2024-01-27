import { Game, SceneEnum } from "../model/game"
import { StarSystem } from "../model/starSystem"
import { LocalBubble } from "../model/localBubble"
import { Resources } from "../resources/resources"
import { updateGameOnLaunch } from "./utilities/updateGameOnLaunch"
import { updateGameOnDocked } from "./utilities/docking"

// this is currently exactly the same as launching but I plan on altering it
export function createDockingLoop(game: Game, resources: Resources, onDocked: () => void) {
  let now = 0
  let outboundMultiplier = 1
  let inboundOffset = 0
  const offsets = [1 / 32.0, 1 / 16.0, 1 / 8.0, 1 / 4.0, 1 / 2.0, 1].reverse()
  game.launching = null
  game.player.dockingComputerFlightExecuter = null

  // A bit rough and ready but an approximation of the launch tunnel from the original
  return function updateDocking(deltaTime: number) {
    if (game.launching === null) {
      game.launching = { inboundRadii: [], outboundRadii: [...offsets].sort((a: number, b: number) => b - a) }
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
    } else if (outboundMultiplier === 8) {
      if (now > 0.1) {
        now = 0
        if (inboundOffset < offsets.length - 1) {
          game.launching.inboundRadii.push(offsets[inboundOffset])
          inboundOffset++
        } else {
          updateGameOnDocked(game)
          onDocked()
        }
      }
    }
  }
}
