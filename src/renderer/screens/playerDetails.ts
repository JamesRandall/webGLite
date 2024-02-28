import { Primitives } from "../primitives/primitives"
import { Game } from "../../model/game"
import { frameColor, frameWidth } from "../../constants"
import { CombatRatingEnum, LaserTypeEnum, LegalStatusEnum } from "../../model/player"
import { drawHeader } from "./screenUtilities"
import { doesSaveExist } from "../../persistence"

function legalStatusText(value: LegalStatusEnum) {
  switch (value) {
    case LegalStatusEnum.Clean:
    default:
      return "Clean"
  }
}

function ratingText(value: CombatRatingEnum) {
  switch (value) {
    case CombatRatingEnum.MostlyHarmless:
      return "Mostly Harmless"
    case CombatRatingEnum.Poor:
      return "Poor"
    case CombatRatingEnum.Average:
      return "Average"
    case CombatRatingEnum.AboveAverage:
      return "Above Average"
    case CombatRatingEnum.Competent:
      return "Competent"
    case CombatRatingEnum.Dangerous:
      return "Dangerous"
    case CombatRatingEnum.Deadly:
      return "Deadly"
    case CombatRatingEnum.Elite:
      return "Elite"
    case CombatRatingEnum.Harmless:
    default:
      return "Harmless"
  }
}

function laserTypeText(value: LaserTypeEnum) {
  switch (value) {
    case LaserTypeEnum.Pulse:
      return "Pulse Laser"
    case LaserTypeEnum.Mining:
      return "Mining Laser"
    case LaserTypeEnum.Beam:
      return "Beam Laser"
    case LaserTypeEnum.Military:
      return "Military Laser"
    case LaserTypeEnum.None:
    default:
      return "None"
  }
}

export function createPlayerDetailsRenderer(draw2d: Primitives) {
  return function renderLocalChart(game: Game) {
    const player = game.player
    const equipment = player.equipment
    let equipmentLine = 12

    drawHeader(draw2d, `COMMANDER ${player.name}`)

    draw2d.text.draw(`Present System          :${game.currentSystem.name}`, [1, 3])
    draw2d.text.draw(`Hyperspace System       :${player.selectedSystem.name}`, [1, 4])
    draw2d.text.draw(`Condition               :${player.isDocked ? "Docked" : "Space"}`, [1, 5])
    draw2d.text.draw(
      `Fuel:${(player.fuel / 10).toLocaleString(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 1 })} Light Years`,
      [1, 6],
    )
    draw2d.text.draw(
      `Cash:    ${player.cash.toLocaleString(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 1 })} Cr`,
      [1, 7],
    )
    draw2d.text.draw(`Legal Status: ${legalStatusText(player.legalStatus)}`, [1, 8])
    draw2d.text.draw(`Rating: ${ratingText(player.combatRating)}`, [1, 9])
    draw2d.text.draw(`EQUIPMENT:`, [1, 11])
    if (equipment.frontLaser != LaserTypeEnum.None) {
      draw2d.text.draw(`Front ${laserTypeText(equipment.frontLaser)}`, [6, equipmentLine++])
    }
    if (equipment.aftLaser != LaserTypeEnum.None) {
      draw2d.text.draw(`Aft ${laserTypeText(equipment.aftLaser)}`, [6, equipmentLine++])
    }
    if (equipment.portLaser != LaserTypeEnum.None) {
      draw2d.text.draw(`Port ${laserTypeText(equipment.portLaser)}`, [6, equipmentLine++])
    }
    if (equipment.starboardLaser != LaserTypeEnum.None) {
      draw2d.text.draw(`Front ${laserTypeText(equipment.starboardLaser)}`, [6, equipmentLine++])
    }
    if (equipment.fuelScoops) {
      draw2d.text.draw(`Fuel Scoops`, [6, equipmentLine++])
    }
    if (equipment.largeCargoBay) {
      draw2d.text.draw(`Large Cargo Bay`, [6, equipmentLine++])
    }
    if (equipment.dockingComputer) {
      draw2d.text.draw(`Docking Computer`, [6, equipmentLine++])
    }
    if (equipment.ecmSystem) {
      draw2d.text.draw(`E.C.M. System`, [6, equipmentLine++])
    }
    if (equipment.galacticHyperdrive) {
      draw2d.text.draw(`Galactic Hyperdrive`, [6, equipmentLine++])
    }

    if (game.flashMessageIntervals.length === 0) {
      if (doesSaveExist()) {
        draw2d.text.center("(S)ave or (L)oad game", 21.5)
      } else {
        draw2d.text.center("(S)ave game", 21.5)
      }
    }
  }
}
