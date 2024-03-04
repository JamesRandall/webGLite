import { Primitives } from "../primitives/primitives"
import { Game } from "../../model/game"
import { vec4 } from "gl-matrix"
import { equipmentForTechLevel, priceForLaser } from "../../model/equipment"
import { LaserMountEnum, LaserTypeEnum, Player, PlayerEquipment } from "../../model/player"
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
  const laserPositions = [
    { mount: LaserMountEnum.Front, text: "Front" },
    { mount: LaserMountEnum.Rear, text: "Rear" },
    { mount: LaserMountEnum.Left, text: "Left" },
    { mount: LaserMountEnum.Right, text: "Right" },
    { mount: LaserMountEnum.None, text: "Cancel" },
  ]

  return function renderMarketPlace(game: Game) {
    const top = 3
    const items = equipmentForTechLevel(game.currentSystem.technologyLevel)
    const fuelPrice = calculateFuelPrice(game.player)
    const canBuyItem = (index: number) => {
      const price = index === 0 ? fuelPrice : items[index].price
      return items[index].canBuy(game.player) && price <= game.player.cash && price > 0.0
    }

    const mouseCharacterPosition = draw2d.text.convertToCharacterCoordinates(game.player.controlState.mousePosition)
    if (
      mouseCharacterPosition[1] >= top &&
      ((game.purchasingLaserType === null && mouseCharacterPosition[1] < top + items.length) ||
        (game.purchasingLaserType !== null && mouseCharacterPosition[1] < top + laserPositions.length))
    ) {
      const itemIndex = mouseCharacterPosition[1] - top

      const rowColor =
        game.purchasingLaserType === null
          ? canBuyItem(itemIndex)
            ? vec4.fromValues(1, 0, 0, 1)
            : vec4.fromValues(0.6, 0.0, 0.0, 1.0)
          : itemIndex < laserPositions.length && itemIndex !== laserPositions.length - 2
            ? vec4.fromValues(1, 0, 0, 1)
            : vec4.fromValues(0.0, 0.0, 0.0, 1.0)
      const drawPos = draw2d.text.convertToPosition([0, mouseCharacterPosition[1]])
      const size = draw2d.text.measure("My")
      draw2d.rect(drawPos, [draw2d.size().width, size.height], rowColor)

      // TODO: we're breaking out of our otherwise so far clean split between rendering and logic here
      // but it, at the time of writing this, doesn't seem worth going to the effort of putting in a system to
      // pull screen interactivity with the mouse out of the renderer
      // A nice to have. May come back and sort.
      if (game.purchasingLaserType === null) {
        if (
          game.player.controlState.mouseDown &&
          !game.player.previousControlState.mouseDown &&
          canBuyItem(itemIndex)
        ) {
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
            case 4:
              game.purchasingLaserType = LaserTypeEnum.Pulse
              break
            case 5:
              game.purchasingLaserType = LaserTypeEnum.Beam
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
            case 12:
              game.purchasingLaserType = LaserTypeEnum.Military
              break
            case 13:
              game.purchasingLaserType = LaserTypeEnum.Mining
              break
          }
        }
      } else {
        if (
          game.player.controlState.mouseDown &&
          !game.player.previousControlState.mouseDown &&
          itemIndex < laserPositions.length
        ) {
          const laserPosition = laserPositions[itemIndex]
          if (laserPosition.mount !== LaserMountEnum.None) {
            const existingLaser = game.player.equipment.lasers.get(laserPosition.mount)
            // get a refund for the existing laser
            if (existingLaser) {
              game.player.cash += priceForLaser(existingLaser)
            }
            game.player.equipment.lasers.set(laserPosition.mount, game.purchasingLaserType!)
            game.player.cash -= priceForLaser(game.purchasingLaserType)
          }
          game.purchasingLaserType = null
        }
      }
    }

    drawHeader(draw2d, "EQUIP SHIP")

    if (game.purchasingLaserType !== null) {
      laserPositions
        .map((item, index) => ({ item, index }))
        .forEach(({ item, index }) => {
          draw2d.text.draw(item.text, [1, top + index], true, vec4.fromValues(1.0, 1.0, 1.0, 1.0))
        })
    } else {
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
    }
    draw2d.text.draw(
      `Cash: ${game.player.cash.toLocaleString(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 1 })} Cr`,
      [1, 21],
    )
  }
}
