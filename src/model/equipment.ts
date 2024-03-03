// The order of this is important as it, combined with the tech level, determines what items are available
import { LaserTypeEnum, Player } from "./player"

const pulseLaserPrice = 400
const beamLaserPrice = 1000
const militaryLaserPrice = 6000
const miningLaserPrice = 800

export const equipment = [
  { name: "Fuel", price: 0, canBuy: (player: Player) => player.fuel < player.blueprint.maxFuel },
  { name: "Missile", price: 30, canBuy: (player: Player) => player.missiles.currentNumber < 4 },
  { name: "Large Cargo Bay", price: 400, canBuy: (player: Player) => !player.equipment.largeCargoBay },
  { name: "E.C.M. System", price: 600, canBuy: (player: Player) => !player.equipment.ecmSystem },
  { name: "Pulse Lasers", price: pulseLaserPrice, canBuy: (player: Player) => true },
  { name: "Beam Lasers", price: beamLaserPrice, canBuy: (player: Player) => true },
  { name: "Fuel Scoops", price: 525, canBuy: (player: Player) => !player.equipment.fuelScoops },
  { name: "Escape Pod", price: 1000, canBuy: (player: Player) => !player.equipment.escapePod },
  { name: "Energy Bomb", price: 900, canBuy: (player: Player) => !player.equipment.energyBomb },
  { name: "Energy Unit", price: 1500, canBuy: (player: Player) => !player.equipment.energyUnit },
  { name: "Docking Computer", price: 1000, canBuy: (player: Player) => !player.equipment.dockingComputer },
  { name: "Galactic Hyperdrive", price: 5000, canBuy: (player: Player) => !player.equipment.galacticHyperdrive },
  { name: "Military Lasers", price: militaryLaserPrice, canBuy: (player: Player) => true },
  { name: "Mining Lasers", price: miningLaserPrice, canBuy: (player: Player) => true },
]

export function equipmentForTechLevel(techLevel: number) {
  const cutOff = techLevel + 3 >= 12 ? 14 : techLevel + 3
  return equipment.slice(0, cutOff)
}
export function priceForLaser(laser: LaserTypeEnum) {
  switch (laser) {
    case LaserTypeEnum.Mining:
      return miningLaserPrice
    case LaserTypeEnum.Military:
      return militaryLaserPrice
    case LaserTypeEnum.Beam:
      return beamLaserPrice
    case LaserTypeEnum.Pulse:
      return pulseLaserPrice
  }
  return 0
}
