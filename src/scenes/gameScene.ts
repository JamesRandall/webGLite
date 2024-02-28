import { getStartingPlayer } from "../model/player"
import { bindKeys } from "../controls/bindKeys"
import { createSceneRenderer } from "../renderer/flight/sceneRenderer"
import { createStardust } from "../gameloop/stardust"
import { LocalBubble } from "../model/localBubble"
import { createSquareModel, createSquareModelWithLoadedTexture } from "../resources/models"
import { generateGalaxy } from "../proceduralGeneration/starSystems"
import { Game, SceneEnum } from "../model/game"
import { createGameLoop } from "../gameloop/gameLoop"
import { createDashboardRenderer } from "../renderer/dashboard/dashboard"
import { Resources } from "../resources/resources"
import { ShipInstance } from "../model/ShipInstance"
import { vec3 } from "gl-matrix"
import { dimensions, worldSize } from "../constants"
import { generateMarketItems } from "../proceduralGeneration/marketItems"
import { bindMouse } from "../controls/bindMouse"
import { createRootRenderer, RenderEffect } from "../renderer/rootRenderer"
import { randomiseSpawnDelta } from "../utilities"
import { newGame } from "../persistence"

export function createGameScene(resources: Resources, gl: WebGL2RenderingContext, renderEffect: RenderEffect) {
  const game = newGame(gl, resources)

  bindKeys(game.player.controlState)
  bindMouse(game.player.controlState)
  const sceneRenderer = createSceneRenderer(gl, resources)
  const dashboardRenderer = createDashboardRenderer(gl, resources, dimensions.width, dimensions.dashboardHeight)
  const rootRenderer = createRootRenderer(gl, resources, sceneRenderer, dashboardRenderer)
  return {
    resize: () => {},
    update: createGameLoop(resources, game, rootRenderer),
  }
}
