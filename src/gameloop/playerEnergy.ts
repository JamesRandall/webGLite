import { Player } from "../model/player"
import { playerEnergyIntervalSeconds } from "../constants"

export function recharge(player: Player, timeDelta: number) {
  player.timeToNextEnergyRecharge -= timeDelta
  if (player.timeToNextEnergyRecharge > 0) return
  player.timeToNextEnergyRecharge += playerEnergyIntervalSeconds

  if (player.energyBankLevel >= player.blueprint.maxEnergy / 2) {
    if (player.aftShield < player.blueprint.maxAftShield) {
      player.aftShield++
      player.energyBankLevel--
    }
    if (player.forwardShield < player.blueprint.maxForwardShield) {
      player.forwardShield++
      player.energyBankLevel--
    }
  }
  player.energyBankLevel += player.equipment.energyUnit ? 2 : 1
}
