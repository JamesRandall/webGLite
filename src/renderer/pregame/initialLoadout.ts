import { Primitives } from "../primitives/primitives"
import { Game } from "../../model/game"
import { vec4 } from "gl-matrix"
import { equipment } from "../../model/equipment"
import { LaserTypeEnum, Player, PlayerEquipment } from "../../model/player"
import { drawHeader } from "../screens/screenUtilities"

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

function buyItem(player: Player, updateEquipment: (equipment: PlayerEquipment) => void) {
  updateEquipment(player.equipment)
}

function isEquipped(player: Player, itemIndex: number) {
  const e = player.equipment
  switch (itemIndex) {
    case 0:
      return player.missiles.currentNumber > 0
    case 1:
      return e.largeCargoBay
    case 2:
      return e.ecmSystem
    case 3:
      return false
    case 4:
      return false
    case 5:
      return e.fuelScoops
    case 6:
      return e.escapePod
    case 7:
      return e.energyBomb
    case 8:
      return e.energyUnit
    case 9:
      return e.dockingComputer
    case 10:
      return e.galacticHyperdrive
    case 11:
      return false
    case 12:
      return false
    default:
      return false
  }
}

export function createInitialLoadoutRenderer(draw2d: Primitives) {
  return function render(game: Game) {
    const top = 3
    const items = equipment.filter((e) => e.name !== "Fuel")

    const mouseCharacterPosition = draw2d.text.convertToCharacterCoordinates(game.player.controlState.mousePosition)
    if (mouseCharacterPosition[1] >= top && mouseCharacterPosition[1] < top + items.length) {
      const itemIndex = mouseCharacterPosition[1] - top

      const rowColor = vec4.fromValues(1, 0, 0, 1)
      const drawPos = draw2d.text.convertToPosition([0, mouseCharacterPosition[1]])
      const size = draw2d.text.measure("My")
      draw2d.rect(drawPos, [draw2d.size().width, size.height], rowColor)

      // TODO: we're breaking out of our otherwise so far clean split between rendering and logic here
      // but it, at the time of writing this, doesn't seem worth going to the effort of putting in a system to
      // pull screen interactivity with the mouse out of the renderer
      // A nice to have. May come back and sort.
      if (game.player.controlState.mouseDown && !game.player.previousControlState.mouseDown) {
        const item = items[itemIndex]
        switch (itemIndex) {
          case 0:
            buyMissile(game.player)
            break
          case 1:
            buyItem(game.player, (equipment: PlayerEquipment) => (equipment.largeCargoBay = !equipment.largeCargoBay))
            break
          case 2:
            buyItem(game.player, (equipment: PlayerEquipment) => (equipment.ecmSystem = !equipment.ecmSystem))
            break
          case 5:
            buyItem(game.player, (equipment: PlayerEquipment) => (equipment.fuelScoops = !equipment.fuelScoops))
            break
          case 6:
            buyItem(game.player, (equipment: PlayerEquipment) => (equipment.escapePod = !equipment.escapePod))
            break
          case 7:
            buyItem(game.player, (equipment: PlayerEquipment) => (equipment.energyBomb = !equipment.energyBomb))
            break
          case 8:
            buyItem(game.player, (equipment: PlayerEquipment) => (equipment.energyUnit = !equipment.energyUnit))
            break
          case 9:
            buyItem(
              game.player,
              (equipment: PlayerEquipment) => (equipment.dockingComputer = !equipment.dockingComputer),
            )
            break
          case 10:
            buyItem(
              game.player,
              (equipment: PlayerEquipment) => (equipment.galacticHyperdrive = !equipment.galacticHyperdrive),
            )
            break
        }
      }
    }

    drawHeader(draw2d, "INITIAL LOADOUT")

    items
      .map((item, index) => ({ item, index }))
      .forEach(({ item, index }) => {
        const color = isEquipped(game.player, index)
          ? vec4.fromValues(1.0, 1.0, 1.0, 1.0)
          : vec4.fromValues(0.6, 0.6, 0.6, 1.0)
        draw2d.text.draw(item.name, [1, top + index], true, color)
        //draw2d.text.draw(itemPrice, [36 - itemPrice.length, top + index], true, color)
      })

    draw2d.text.center("Press SPACE or Fire Commander", 21)
  }
}
