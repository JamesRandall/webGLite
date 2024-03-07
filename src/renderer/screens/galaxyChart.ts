import { Primitives } from "../primitives/primitives"
import { Game } from "../../model/game"
import { isPointInRect } from "../../model/geometry"
import { vec2, vec4 } from "gl-matrix"
import { StarSystem } from "../../model/starSystem"
import { frameColor, frameWidth, galaxySize } from "../../constants"
import { drawHeader } from "./screenUtilities"

export function createLongRangeChartRenderer(draw2d: Primitives) {
  const wRatio = draw2d.size().width / galaxySize.width
  const hRatio = draw2d.size().height / galaxySize.height
  const xScale = hRatio > wRatio ? wRatio : hRatio
  const yScale = hRatio > wRatio ? wRatio : hRatio

  const top = 40 + yScale
  const left = draw2d.size().width / 2 - (galaxySize.width * xScale) / 2

  return function renderGalaxyChart(game: Game) {
    const currentCenter = vec2.fromValues(
      game.currentSystem.galacticPosition[0] * xScale + left,
      game.currentSystem.galacticPosition[1] * yScale + top,
    )
    const currentCursor = vec2.add(
      vec2.create(),
      vec2.multiply(vec2.create(), game.player.scannerCursor, [xScale, yScale]),
      [left, top],
    )

    draw2d.circle(currentCenter, (game.player.fuel / 10.0) * xScale, [1.0, 0.0, 0.0, 1.0])
    draw2d.circle(currentCenter, (game.player.fuel / 10.0) * xScale - 2, [0.0, 0.0, 0.0, 1.0])

    game.stars.forEach((star) => {
      const center = vec2.fromValues(star.galacticPosition[0] * xScale + left, star.galacticPosition[1] * yScale + top)
      draw2d.circle(center, 2, frameColor)
    })

    drawHeader(draw2d, `GALACTIC CHART  ${game.player.galaxyIndex + 1}`)
    if (hRatio > wRatio) {
      draw2d.rect([0, top + galaxySize.height * yScale], [draw2d.size().width, frameWidth], frameColor)
    } else {
      draw2d.rect([left, top - yScale - 1], [frameWidth, galaxySize.height * yScale], frameColor)
      draw2d.rect(
        [left + galaxySize.width * xScale, top - yScale - 1],
        [frameWidth, galaxySize.height * yScale],
        frameColor,
      )
    }

    draw2d.rect([currentCursor[0] - 1.5, currentCursor[1] - 10], [3, -10], [1.0, 1.0, 1.0, 1.0])
    draw2d.rect([currentCursor[0] - 1.5, currentCursor[1] + 10], [3, 10], [1.0, 1.0, 1.0, 1.0])
    draw2d.rect([currentCursor[0] - 10, currentCursor[1] - 1.5], [-10, 3], [1.0, 1.0, 1.0, 1.0])
    draw2d.rect([currentCursor[0] + 10, currentCursor[1] - 1.5], [10, 3], [1.0, 1.0, 1.0, 1.0])
  }
}
