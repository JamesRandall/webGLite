import { Player } from "../../model/player"

export function availableCargoSpace(player: Player) {
  const totalCargo = player.cargoHoldContents.reduce((t, c) => t + c, 0)
  return player.ship.maxCargo + (player.equipment.largeCargoBay ? 12 : 0) - totalCargo
}
