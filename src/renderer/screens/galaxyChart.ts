import { Primitives } from "../primitives/primitives"
import { Game } from "../../model/game"
import { isPointInRect } from "../../model/geometry"
import { vec2, vec4 } from "gl-matrix"
import { StarSystem } from "../../model/starSystem"
import { frameColor, frameWidth, galaxySize } from "../../constants"

export function createLongRangeChartRenderer(draw2d: Primitives) {
  const xScale = draw2d.size().width / galaxySize.width
  const yScale = draw2d.size().width / galaxySize.width
  const top = 40 + yScale

  return function renderGalaxyChart(game: Game) {
    const orange = vec4.fromValues(0xf5 / 255.0, 0x9e / 255.0, 0x0b / 255.0, 1.0)
    const currentCenter = vec2.fromValues(
      game.currentSystem.galacticPosition[0] * xScale,
      game.currentSystem.galacticPosition[1] * yScale + top,
    )
    const currentCursor = vec2.add(
      vec2.create(),
      vec2.multiply(vec2.create(), game.player.scannerCursor, [xScale, yScale]),
      [0, top],
    )

    draw2d.circle(currentCenter, (game.player.fuel / 10.0) * xScale, [1.0, 0.0, 0.0, 1.0])
    draw2d.circle(currentCenter, (game.player.fuel / 10.0) * xScale - 2, [0.0, 0.0, 0.0, 1.0])

    game.stars.forEach((star) => {
      const center = vec2.fromValues(star.galacticPosition[0] * xScale, star.galacticPosition[1] * yScale + top)
      draw2d.circle(center, 2, frameColor)
    })

    draw2d.text.draw(`GALACTIC CHART  ${game.player.galaxyIndex + 1}`, [10, 0.5])
    draw2d.rect([0, 40], [draw2d.size().width, frameWidth], frameColor)
    draw2d.rect([0, top + galaxySize.height * yScale], [draw2d.size().width, frameWidth], frameColor)

    draw2d.rect([currentCursor[0] - 1.5, currentCursor[1] - 10], [3, -10], [1.0, 1.0, 1.0, 1.0])
    draw2d.rect([currentCursor[0] - 1.5, currentCursor[1] + 10], [3, 10], [1.0, 1.0, 1.0, 1.0])
    draw2d.rect([currentCursor[0] - 10, currentCursor[1] - 1.5], [-10, 3], [1.0, 1.0, 1.0, 1.0])
    draw2d.rect([currentCursor[0] + 10, currentCursor[1] - 1.5], [10, 3], [1.0, 1.0, 1.0, 1.0])
  }
}
