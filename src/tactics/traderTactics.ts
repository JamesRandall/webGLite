import { ShipInstance } from "../model/ShipInstance"
import { Game } from "../model/game"
import { bountyHunterTactics } from "./bountyHunterTactics"

export function traderTactics(trader: ShipInstance, game: Game) {
  if (Math.random() > 0.8) {
    // 20% of the time traders activate as bounty hunters
    bountyHunterTactics(trader, game)
  }
}
