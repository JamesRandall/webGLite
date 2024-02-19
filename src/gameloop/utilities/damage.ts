import { Resources } from "../../resources/resources"
import { Game, SceneEnum } from "../../model/game"
import { ShipInstance } from "../../model/ShipInstance"

export enum DamageLocationEnum {
  Shields,
  Energy,
}

export function applyDamage(game: Game, resources: Resources, ship: ShipInstance, damage: number) {
  const isForeDamage = ship.position[2] < 0
  if (isForeDamage) {
    if (game.player.forwardShield < damage) {
      damage -= game.player.forwardShield
      game.player.forwardShield = 0
    } else {
      game.player.forwardShield -= damage
      damage = 0
    }
  } else {
    if (game.player.aftShield < damage) {
      damage -= game.player.aftShield
      game.player.aftShield = 0
    } else {
      game.player.aftShield -= damage
      damage = 0
    }
  }
  const location = damage > 0 ? DamageLocationEnum.Energy : DamageLocationEnum.Shields
  game.player.energyBankLevel -= damage
  if (game.player.energyBankLevel < 0) {
    game.currentScene = SceneEnum.PlayerExploding
  }
  return location
  // TODO: Occasionally we release some cargo
}
