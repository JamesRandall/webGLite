import { Primitives } from "../primitives/primitives"
import { Game } from "../../model/game"
import { frameColor, frameWidth } from "../../constants"
import { economyText, governmentText, StarSystem } from "../../model/starSystem"
import { vec2, vec4 } from "gl-matrix"
import { getNearestSystemToCursor } from "../../gameloop/utilities/map"
import { availableCargoSpace } from "../../gameloop/utilities/cargo"

export function createBuyMarketItemsRenderer(draw2d: Primitives) {
  return function renderMarketPlace(game: Game, priceListOnly: boolean) {
    const forSaleBegin = 24
    const forSaleEnd = 27
    const cargoHoldBegin = 30
    const cargoHoldEnd = 34
    const headerRows = 2
    let y = priceListOnly ? 2 : 1

    if (!priceListOnly) {
      const mouseCharacterPosition = draw2d.text.convertToCharacterCoordinates(game.player.controlState.mousePosition)
      if (mouseCharacterPosition[1] > y + 1 && mouseCharacterPosition[1] < y + 2 + game.marketItems.length) {
        const drawPos = draw2d.text.convertToPosition([0, mouseCharacterPosition[1]])
        const size = draw2d.text.measure("My")
        draw2d.rect(drawPos, [draw2d.size().width, size.height], [1, 0, 0, 1])

        // TODO: we're breaking out of our otherwise so far clean split between rendering and logic here
        // but it, at the time of writing this, doesn't seem worth going to the effort of putting in a system to
        // pull screen interactivity with the mouse out of the renderer
        // A nice to have. May come back and sort.
        if (game.player.controlState.mouseDown && !game.player.previousControlState.mouseDown) {
          const itemIndex = mouseCharacterPosition[1] - y - headerRows
          const item = game.marketItems[itemIndex]
          if (mouseCharacterPosition[0] <= forSaleEnd) {
            // TODO: we also need to do a cargo hold total contents check
            const units = Math.min(
              availableCargoSpace(game.player),
              game.player.controlState.shiftPressed ? 5 : 1,
              item.quantityForSale,
            )
            if (units > 0 && units * item.unitPrice < game.player.cash) {
              item.quantityForSale -= units
              game.player.cargoHoldContents[itemIndex] += units
              game.player.cash -= units * item.unitPrice
            }
          } else if (mouseCharacterPosition[0] >= cargoHoldBegin) {
            const units = Math.min(
              game.player.controlState.shiftPressed ? 5 : 1,
              game.player.cargoHoldContents[itemIndex],
            )
            if (units > 0) {
              item.quantityForSale += units
              game.player.cargoHoldContents[itemIndex] -= units
              game.player.cash += units * item.unitPrice
            }
          }
        }
      }
    }

    if (priceListOnly) {
      draw2d.text.draw(`${game.currentSystem.name.toUpperCase()} MARKET PRICES`, [5, 0.5])
      draw2d.rect([0, 40], [draw2d.size().width, frameWidth], frameColor)
    }

    draw2d.text.draw("PRODUCT", [2, y + 1])
    draw2d.text.draw("UNIT", [12, y + 1])
    draw2d.text.draw("UNIT", [17, y])
    draw2d.text.draw("PRICE", [17, y + 1])

    if (!priceListOnly) {
      draw2d.text.draw("FOR", [forSaleBegin, y])
      draw2d.text.draw("SALE", [forSaleBegin, y + 1])
      draw2d.text.draw("CARGO", [cargoHoldBegin, y])
      draw2d.text.draw("HOLD", [cargoHoldBegin, y + 1])
    } else {
      draw2d.text.draw("QUANTITY", [forSaleBegin, y])
      draw2d.text.draw("FOR SALE", [forSaleBegin, y + 1])
    }
    y += headerRows

    game.marketItems
      .map((item, index) => ({ item, index }))
      .forEach(({ item, index }) => {
        draw2d.text.draw(item.name, [1, y])
        draw2d.text.draw(item.unit, [14, y])
        draw2d.text.draw(
          item.unitPrice.toLocaleString(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 1 }),
          [17, y],
        )
        if (item.quantityForSale > 0) {
          draw2d.text.draw(`${item.quantityForSale}${item.unit}`, [forSaleBegin, y])
        } else {
          draw2d.text.draw(" - ", [forSaleBegin, y])
        }
        if (!priceListOnly) {
          if (game.player.cargoHoldContents[index] > 0) {
            draw2d.text.draw(`${game.player.cargoHoldContents[index]}${item.unit}`, [cargoHoldBegin, y])
          }
        }
        y++
      })
    if (!priceListOnly) {
      draw2d.text.draw(
        `Cash: ${game.player.cash.toLocaleString(undefined, {
          maximumFractionDigits: 1,
          minimumFractionDigits: 1,
        })} Cr`,
        [1, y + 1],
      )
      draw2d.text.draw(`Cargo space: ${availableCargoSpace(game.player)}`, [20, y + 1])
    }
  }
}
