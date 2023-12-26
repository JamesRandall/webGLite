import {Primitives} from "./primitives/primitives";
import {Game} from "../model/game";
import {isPointInRect} from "../model/geometry";
import {vec2, vec4} from "gl-matrix";
import {StarSystem} from "../model/starSystem";
import {frameColor, frameWidth, galaxySize} from "../constants";

export function createLocalChartRenderer(draw2d: Primitives) {
    const xMax = 25 * (galaxySize.width/256.0)
    const yMax = 50 * (galaxySize.height/256.0)
    const xRange = xMax*2
    const yRange = yMax*2
    const xScale = draw2d.size().width / xRange / 1.4
    const yScale = draw2d.size().width / xRange / 1.4
    const xOffset = -1
    const yOffset = -1

    function distance(star1: StarSystem, star2: StarSystem) {
        const xDelta = star2.galacticPosition.x - star1.galacticPosition.x
        const yDelta = star2.galacticPosition.y - star1.galacticPosition.y
        return Math.sqrt(xDelta*xDelta + yDelta*yDelta)
    }

    return function renderLocalChart(game: Game) {
        const viewRect = {
            left: game.player.currentSystem.galacticPosition.x - xMax + xOffset,
            top: game.player.currentSystem.galacticPosition.y - yMax + yOffset,
            width: xRange,
            height: yRange
        }

        const orange = vec4.fromValues(0xf5/255.0, 0x9e/255.0, 0x0b/255.0, 1.0)
        const currentCenter = vec2.fromValues(
            (game.player.currentSystem.galacticPosition.x - viewRect.left) * xScale,
            (game.player.currentSystem.galacticPosition.y - viewRect.top) * yScale
        )
        const currentCursor = vec2.fromValues(
            (game.player.scannerCursor.x - viewRect.left) * xScale,
            (game.player.scannerCursor.y - viewRect.top) * yScale
        )
        draw2d.circle(currentCenter, game.player.fuel / 10.0 * xScale, [1.0,0.0,0.0,1.0])
        draw2d.circle(currentCenter, game.player.fuel / 10.0 * xScale - 2, [0.0,0.0,0.0,1.0])

        const usedTextRows: boolean[] = []

        game.stars.forEach(star => {
            if (isPointInRect(star.galacticPosition, viewRect)) {
                //const xDist = Math.abs(star.galacticPosition.x - game.player.currentSystem.galacticPosition.x)
                //const yDist = Math.abs(star.galacticPosition.y - game.player.currentSystem.galacticPosition.y)
                //if (xDist < xMax && yDist < yMax) {
                if (distance(star, game.player.currentSystem) < 8) {
                    const center = vec2.fromValues(
                        (star.galacticPosition.x - viewRect.left) * xScale,
                        (star.galacticPosition.y - viewRect.top) * yScale
                    )
                    draw2d.circle(center, star.shortRangeDotSize * 2, orange)
                    const characterPosition = draw2d.text.convertToCharacterCoordinates(vec2.fromValues(center[0], center[1]))
                    let row : number | null = characterPosition[1]
                    if (usedTextRows[row]) {
                        if (!usedTextRows[row+1]) {
                            row++
                        }
                        else if (!usedTextRows[row-1]) {
                            row--
                        }
                        else {
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

        draw2d.text.draw('SHORT RANGE CHART', [10,0.5])
        draw2d.rect([0,40], [draw2d.size().width, frameWidth], frameColor)

        draw2d.rect([currentCursor[0]-1.5,currentCursor[1]-10], [3,-30], [1.0,1.0,1.0,1.0])
        draw2d.rect([currentCursor[0]-1.5,currentCursor[1]+10], [3,30], [1.0,1.0,1.0,1.0])
        draw2d.rect([currentCursor[0]-10,currentCursor[1]-1.5], [-30,3], [1.0,1.0,1.0,1.0])
        draw2d.rect([currentCursor[0]+10,currentCursor[1]-1.5], [30,3], [1.0,1.0,1.0,1.0])
    }
}