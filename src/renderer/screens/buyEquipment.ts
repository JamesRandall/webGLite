import { Primitives } from "../primitives/primitives"
import { Game } from "../../model/game"
import { frameColor, frameWidth } from "../../constants"
import { economyText, governmentText, StarSystem } from "../../model/starSystem"
import { vec2, vec4 } from "gl-matrix"
import { getNearestSystemToCursor } from "../../gameloop/utilities/map"
import { availableCargoSpace } from "../../gameloop/utilities/cargo"
import { equipment, equipmentForTechLevel } from "../../model/equipment"
import { Player, PlayerEquipment } from "../../model/player"
import { drawHeader } from "./screenUtilities"

function calculateFuelPrice(player: Player) {
  return ((player.blueprint.maxFuel - player.fuel) / player.blueprint.maxFuel) * 14.0
}

function buyFuel(player: Player) {
  player.cash -= calculateFuelPrice(player)
  player.fuel = player.blueprint.maxFuel
}

function buyMissile(player: Player) {
  if (player.missiles.currentNumber < 4) {
    player.cash -= 30
    player.missiles.currentNumber++
  }
}

function buyItem(player: Player, price: number, updateEquipment: (equipment: PlayerEquipment) => void) {
  if (player.cash > price) {
    player.cash -= price
    updateEquipment(player.equipment)
  }
}

export function createBuyEquipmentRenderer(draw2d: Primitives) {
  return function renderMarketPlace(game: Game) {
    const top = 3
    const items = equipmentForTechLevel(game.currentSystem.technologyLevel)
    const fuelPrice = calculateFuelPrice(game.player)
    const canBuyItem = (index: number) => {
      const price = index === 0 ? fuelPrice : items[index].price
      return items[index].canBuy(game.player) && price <= game.player.cash && price > 0.0
    }

    const mouseCharacterPosition = draw2d.text.convertToCharacterCoordinates(game.player.controlState.mousePosition)
    if (mouseCharacterPosition[1] >= top && mouseCharacterPosition[1] < top + items.length) {
      const itemIndex = mouseCharacterPosition[1] - top

      const rowColor = canBuyItem(itemIndex) ? vec4.fromValues(1, 0, 0, 1) : vec4.fromValues(0.6, 0.0, 0.0, 1.0)
      const drawPos = draw2d.text.convertToPosition([0, mouseCharacterPosition[1]])
      const size = draw2d.text.measure("My")
      draw2d.rect(drawPos, [draw2d.size().width, size.height], rowColor)

      // TODO: we're breaking out of our otherwise so far clean split between rendering and logic here
      // but it, at the time of writing this, doesn't seem worth going to the effort of putting in a system to
      // pull screen interactivity with the mouse out of the renderer
      // A nice to have. May come back and sort.
      if (game.player.controlState.mouseDown && !game.player.previousControlState.mouseDown && canBuyItem(itemIndex)) {
        const item = items[itemIndex]
        switch (itemIndex) {
          case 0:
            buyFuel(game.player)
            break
          case 1:
            buyMissile(game.player)
            break
          case 2:
            buyItem(game.player, item.price, (equipment: PlayerEquipment) => (equipment.largeCargoBay = true))
            break
          case 3:
            buyItem(game.player, item.price, (equipment: PlayerEquipment) => (equipment.ecmSystem = true))
            break
          case 6:
            buyItem(game.player, item.price, (equipment: PlayerEquipment) => (equipment.fuelScoops = true))
            break
          case 7:
            buyItem(game.player, item.price, (equipment: PlayerEquipment) => (equipment.escapePod = true))
            break
          case 8:
            buyItem(game.player, item.price, (equipment: PlayerEquipment) => (equipment.energyBomb = true))
            break
          case 9:
            buyItem(game.player, item.price, (equipment: PlayerEquipment) => (equipment.energyUnit = true))
            break
          case 10:
            buyItem(game.player, item.price, (equipment: PlayerEquipment) => (equipment.dockingComputer = true))
            break
          case 11:
            buyItem(game.player, item.price, (equipment: PlayerEquipment) => (equipment.galacticHyperdrive = true))
            break
          case 2:
            buyItem(game.player, item.price, (equipment: PlayerEquipment) => (equipment.largeCargoBay = true))
            break
        }
      }
    }

    drawHeader(draw2d, "EQUIP SHIP")

    items
      .map((item, index) => ({ item, index }))
      .forEach(({ item, index }) => {
        const color = canBuyItem(index) ? vec4.fromValues(1.0, 1.0, 1.0, 1.0) : vec4.fromValues(0.6, 0.6, 0.6, 1.0)
        draw2d.text.draw(item.name, [1, top + index], true, color)
        const itemPrice = (index === 0 ? fuelPrice : item.price).toLocaleString(undefined, {
          maximumFractionDigits: 1,
          minimumFractionDigits: 1,
        })
        draw2d.text.draw(itemPrice, [36 - itemPrice.length, top + index], true, color)
      })
    draw2d.text.draw(
      `Cash: ${game.player.cash.toLocaleString(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 1 })} Cr`,
      [1, 21],
    )
  }
}
