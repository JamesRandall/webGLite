import { Primitives } from "../primitives/primitives"
import { Game } from "../../model/game"
import { isPointInRect } from "../../model/geometry"
import { vec2, vec4 } from "gl-matrix"
import { StarSystem } from "../../model/starSystem"
import { frameColor, frameWidth, galaxySize } from "../../constants"
import { drawHeader } from "./screenUtilities"

export function createLocalChartRenderer(draw2d: Primitives) {
  const width = Math.min(draw2d.size().width, draw2d.size().height)

  const xMax = 25 * (galaxySize.width / 256.0)
  const yMax = 50 * (galaxySize.height / 256.0)
  const xRange = xMax * 2
  const yRange = yMax * 2
  const xScale = width / xRange
  const yScale = width / xRange
  const xOffset = -1
  const yOffset = -1

  /*function distance(star1: StarSystem, star2: StarSystem) {
        const xDelta = star2.galacticPosition.x - star1.galacticPosition.x
        const yDelta = star2.galacticPosition.y - star1.galacticPosition.y
        return Math.sqrt(xDelta*xDelta + yDelta*yDelta)
    }*/

  return function renderLocalChart(game: Game) {
    const viewRect = {
      left: game.currentSystem.galacticPosition[0] - xMax + xOffset,
      top: game.currentSystem.galacticPosition[1] - yMax + yOffset,
      width: xRange,
      height: yRange,
    }

    const orange = vec4.fromValues(0xf5 / 255.0, 0x9e / 255.0, 0x0b / 255.0, 1.0)
    const currentCenter = vec2.fromValues(
      (game.currentSystem.galacticPosition[0] - viewRect.left) * xScale,
      (game.currentSystem.galacticPosition[1] - viewRect.top) * yScale,
    )
    const currentCursor = vec2.multiply(
      vec2.create(),
      vec2.subtract(vec2.create(), game.player.scannerCursor, [viewRect.left, viewRect.top]),
      [xScale, yScale],
    )

    draw2d.circle(currentCenter, (game.player.fuel / 10.0) * xScale, [1.0, 0.0, 0.0, 1.0])
    draw2d.circle(currentCenter, (game.player.fuel / 10.0) * xScale - 2, [0.0, 0.0, 0.0, 1.0])

    const usedTextRows: boolean[] = []

    game.stars.forEach((star) => {
      if (isPointInRect(star.galacticPosition, viewRect)) {
        //const xDist = Math.abs(star.galacticPosition.x - game.player.currentSystem.galacticPosition.x)
        //const yDist = Math.abs(star.galacticPosition.y - game.player.currentSystem.galacticPosition.y)
        //if (xDist < xMax && yDist < yMax) {
        const distance = vec2.distance(star.galacticPosition, game.currentSystem.galacticPosition)
        if (distance < 8) {
          const center = vec2.fromValues(
            (star.galacticPosition[0] - viewRect.left) * xScale,
            (star.galacticPosition[1] - viewRect.top) * yScale,
          )
          draw2d.circle(center, star.shortRangeDotSize * 2, orange)
          const characterPosition = draw2d.text.convertToCharacterCoordinates(vec2.fromValues(center[0], center[1]))
          let row: number | null = characterPosition[1]
          if (usedTextRows[row]) {
            if (!usedTextRows[row + 1]) {
              row++
            } else if (!usedTextRows[row - 1]) {
              row--
            } else {
              row = null
            }
          }
          if (row !== null) {
            usedTextRows[row] = true
            const position = draw2d.text.convertToPosition(vec2.fromValues(characterPosition[0], row))
            draw2d.text.draw(`${star.name}`, vec2.fromValues(center[0] + 10, position[1]), false)
          }
        }
      }
    })

    drawHeader(draw2d, "SHORT RANGE SCANNER")

    draw2d.rect([currentCursor[0] - 1.5, currentCursor[1] - 10], [3, -30], [1.0, 1.0, 1.0, 1.0])
    draw2d.rect([currentCursor[0] - 1.5, currentCursor[1] + 10], [3, 30], [1.0, 1.0, 1.0, 1.0])
    draw2d.rect([currentCursor[0] - 10, currentCursor[1] - 1.5], [-30, 3], [1.0, 1.0, 1.0, 1.0])
    draw2d.rect([currentCursor[0] + 10, currentCursor[1] - 1.5], [30, 3], [1.0, 1.0, 1.0, 1.0])
  }
}
