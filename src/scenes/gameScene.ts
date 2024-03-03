import { bindKeys } from "../controls/bindKeys"
import { createSceneRenderer } from "../renderer/flight/sceneRenderer"
import { createGameLoop } from "../gameloop/gameLoop"
import { createDashboardRenderer } from "../renderer/dashboard/dashboard"
import { Resources } from "../resources/resources"
import { dimensions } from "../constants"
import { bindMouse } from "../controls/bindMouse"
import { createRootRenderer, RenderEffect } from "../renderer/rootRenderer"
import { loadGame, newGame, saveGame } from "../persistence"
import { Size } from "../model/geometry"
import { Scene } from "./scene"
import { Game } from "../model/game"

export const createGameScene = (resources: Resources, gl: WebGL2RenderingContext, loadedGame: Game): Scene => {
  let game = loadedGame

  let unbindKeys = bindKeys(game.player.controlState)
  let unbindMouse = bindMouse(game.player.controlState)
  let sceneRenderer = createSceneRenderer(gl, resources)
  let dashboardRenderer = createDashboardRenderer(gl, resources, dimensions.width, dimensions.dashboardHeight)
  let rootRenderer = createRootRenderer(gl, resources, sceneRenderer, dashboardRenderer)

  let update = createGameLoop(resources, rootRenderer, () => {
    game = loadGame(gl, resources) ?? game
    unbindKeys()
    unbindMouse()
    bindKeys(game.player.controlState)
    bindMouse(game.player.controlState)
  })

  let resize = () => {
    sceneRenderer = createSceneRenderer(gl, resources)
    dashboardRenderer = createDashboardRenderer(gl, resources, dimensions.width, dimensions.dashboardHeight)
    rootRenderer = createRootRenderer(gl, resources, sceneRenderer, dashboardRenderer)

    update = createGameLoop(resources, rootRenderer, () => {
      unbindKeys()
      unbindMouse()
      bindKeys(game.player.controlState)
      bindMouse(game.player.controlState)
    })
  }

  return {
    resize: resize,
    update: (now: number, sz: Size) => update(now, game),
  }
}
