import { Player } from "../../model/player"

export function availableCargoSpace(player: Player) {
  const totalCargo = player.cargoHoldContents.reduce((t, c) => t + c, 0)
  return player.blueprint.maxCargo + (player.equipment.largeCargoBay ? 15 : 0) - totalCargo
}

export function totalCargoSpace(player: Player) {
  return player.blueprint.maxCargo + (player.equipment.largeCargoBay ? 15 : 0)
}

export function usedCargoSpace(player: Player) {
  return player.cargoHoldContents.reduce((t, c) => t + c, 0)
}
