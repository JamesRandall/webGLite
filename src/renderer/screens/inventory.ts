import { Primitives } from "../primitives/primitives"
import { Game } from "../../model/game"
import { frameColor, frameWidth } from "../../constants"
import { CombatRatingEnum, LaserTypeEnum, LegalStatusEnum } from "../../model/player"
import { drawHeader } from "./screenUtilities"

export function createInventoryRenderer(draw2d: Primitives) {
  return function renderInventory(game: Game) {
    const player = game.player

    drawHeader(draw2d, "INVENTORY")
    draw2d.text.draw(
      `Fuel:${(player.fuel / 10).toLocaleString(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 1 })} Light Years`,
      [1, 3],
    )
    draw2d.text.draw(
      `Cash:     ${player.cash.toLocaleString(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 1 })} Cr`,
      [1, 4],
    )

    let y = 6
    game.marketItems
      .map((item, index) => ({ item, index }))
      .forEach(({ item, index }) => {
        if (game.player.cargoHoldContents[index] > 0) {
          const quantity = game.player.cargoHoldContents[index]
          draw2d.text.draw(item.name, [1, y])
          draw2d.text.draw(`${quantity}${item.unit}`, [quantity >= 10 ? 15 : 16, y])
          y++
        }
      })
  }
}
