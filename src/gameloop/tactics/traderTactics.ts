import { AttitudeEnum, ShipInstance, ShipRoleEnum } from "../../model/ShipInstance"
import { Game } from "../../model/game"
import { bountyHunterTactics } from "./bountyHunterTactics"
import { LegalStatusEnum } from "../../model/player"

export function traderTactics(trader: ShipInstance, game: Game) {
  // if the player has been bad their is a 20% chance of the trader becoming a hostile bounty huntee
  if (
    Math.random() > 0.8 &&
    (game.player.legalStatus === LegalStatusEnum.SeriousOffender ||
      game.player.legalStatus === LegalStatusEnum.Fugitive)
  ) {
    trader.aiEnabled = true
    trader.attitude = AttitudeEnum.Hostile
    trader.role = ShipRoleEnum.BountyHunter
  }
  // a trader becomes hostile if attacked - in which case it behaves like a bounty hunter
  if (trader.attitude === AttitudeEnum.Hostile && trader.aiEnabled) {
    bountyHunterTactics(trader, game)
  }
}
