import { AttitudeEnum, ShipInstance, ShipRoleEnum } from "../../model/ShipInstance"
import { Game } from "../../model/game"
import { LegalStatusEnum } from "../../model/player"

export function bountyHunterTactics(ship: ShipInstance, game: Game) {
  if (
    game.player.legalStatus === LegalStatusEnum.SeriousOffender ||
    game.player.legalStatus === LegalStatusEnum.Fugitive
  ) {
    ship.attitude = AttitudeEnum.Hostile
  }
}
