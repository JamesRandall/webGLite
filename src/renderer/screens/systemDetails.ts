import { Primitives } from "../primitives/primitives"
import { Game } from "../../model/game"
import { frameColor, frameWidth } from "../../constants"
import { economyText, governmentText, StarSystem } from "../../model/starSystem"
import { vec2 } from "gl-matrix"
import { getNearestSystemToCursor } from "../../gameloop/utilities/map"

export function createSystemDetailsRenderer(draw2d: Primitives) {
  return function renderLocalChart(game: Game) {
    const system = getNearestSystemToCursor(game)
    game.player.scannerCursor = vec2.copy(vec2.create(), system.galacticPosition)
    game.player.selectedSystem = system
    const title = `DATA ON ${system.name.toUpperCase()}`
    draw2d.text.draw(title, [19 - title.length / 2, 0.5])
    draw2d.rect([0, 40], [draw2d.size().width, frameWidth], frameColor)
    //draw2d.text.draw("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", [0,0])

    //if (game.player.currentSystem.seed !== )
    draw2d.text.draw(`Distance:      7.6 Light Years`, [1, 3])
    draw2d.text.draw(`Economy:${economyText[system.economy]}`, [1, 5])
    draw2d.text.draw(`Government:${governmentText[system.government]}`, [1, 7])
    draw2d.text.draw(`Tech.Level:  ${system.technologyLevel + 1}`, [1, 9])
    draw2d.text.draw(`Population:${system.population / 10.0} Billion`, [1, 11])
    draw2d.text.draw(`(${system.speciesType})`, [1, 13])
    draw2d.text.draw(`Gross Productivity: ${system.productivity} M CR`, [1, 15])
    draw2d.text.draw(`Average Radius: ${system.averageRadius} km`, [1, 17])
  }
}
