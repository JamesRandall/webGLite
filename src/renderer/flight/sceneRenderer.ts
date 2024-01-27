import { createShipsRenderer } from "./ships"
import { createStardustRenderer } from "./stardust"
import { createSunRenderer } from "./sun"
import { createPrimitiveRenderer } from "../primitives/primitives"
import { Game, SceneEnum } from "../../model/game"
import { createLocalChartRenderer } from "../screens/localChart"
import { createSystemDetailsRenderer } from "../screens/systemDetails"
import {
  bindBufferAndSetViewport,
  createFrameBufferTexture,
  createProjectionMatrix,
  drawFrame,
  setupGl,
} from "../common"
import { createPlayerDetailsRenderer } from "../screens/playerDetails"
import { createLaunchingRenderer } from "../screens/launching"
import { createHyperspaceRenderer } from "../screens/hyperspace"
import { createSphericalPlanetRenderer } from "./sphericalPlanet"
import { Resources } from "../../resources/resources"
import { createBuyMarketItemsRenderer } from "../screens/buyMarketItems"
import { dimensions } from "../../constants"
import { mat4 } from "gl-matrix"

export function createSceneRenderer(gl: WebGLRenderingContext, resources: Resources) {
  const viewportWidth = dimensions.width
  const viewportHeight = dimensions.mainViewHeight

  const draw2d = createPrimitiveRenderer(gl, false, resources, viewportWidth, viewportHeight)

  const shipRenderer = createShipsRenderer(gl, resources)
  const stardustRenderer = createStardustRenderer(gl, resources)
  const sunRenderer = createSunRenderer(gl, resources)
  const planetRenderer = createSphericalPlanetRenderer(gl, resources)
  const localChartRenderer = createLocalChartRenderer(draw2d)
  const systemDetailsRenderer = createSystemDetailsRenderer(draw2d)
  const playerDetailsRenderer = createPlayerDetailsRenderer(draw2d)
  const launchingRenderer = createLaunchingRenderer(gl, viewportWidth, viewportHeight, resources)
  const hyperspaceRenderer = createHyperspaceRenderer(gl, viewportWidth, viewportHeight, resources)
  const buyMarketItemsRenderer = createBuyMarketItemsRenderer(draw2d)
  let flashOn = true
  let flashOnTime = 0

  return (game: Game, timeDelta: number) => {
    const projectionMatrix = createProjectionMatrix(viewportWidth, viewportHeight, game.localBubble.clipSpaceRadius)
    const cameraMatrix = mat4.lookAt(mat4.create(), game.player.lookAt, [0, 0, 0], [0, 1, 0])
    const viewMatrix = mat4.invert(mat4.create(), cameraMatrix)
    const viewProjectionMatrix = mat4.multiply(mat4.create(), projectionMatrix, viewMatrix)

    flashOnTime += timeDelta
    if (flashOnTime > 1.5) {
      flashOnTime = 0
      flashOn = !flashOn
    }

    switch (game.currentScene) {
      case SceneEnum.Front:
        gl.enable(gl.CULL_FACE)
        gl.enable(gl.DEPTH_TEST)
        shipRenderer(viewProjectionMatrix, game.localBubble)
        sunRenderer(viewProjectionMatrix, game.localBubble, timeDelta)
        planetRenderer(viewProjectionMatrix, game.localBubble, timeDelta)
        stardustRenderer(game)
        gl.disable(gl.CULL_FACE)
        gl.disable(gl.DEPTH_TEST)
        break

      case SceneEnum.LocalMap:
        localChartRenderer(game)
        break

      case SceneEnum.SystemDetails:
        systemDetailsRenderer(game)
        break

      case SceneEnum.PlayerDetails:
        playerDetailsRenderer(game)
        break

      case SceneEnum.Docking:
      case SceneEnum.Launching:
        launchingRenderer(game)
        break

      case SceneEnum.Hyperspace:
        hyperspaceRenderer(game)
        break

      case SceneEnum.BuyMarketItems:
        buyMarketItemsRenderer(game)
        break
    }

    gl.disable(gl.DEPTH_TEST)

    if (game.hyperspace !== null && game.hyperspace.countdown > 0) {
      draw2d.text.draw(game.hyperspace.countdown.toString(), [0.5, 0.5])
      const hyperspaceText = `HYPERSPACE - ${game.player.selectedSystem.name}`
      const xPos = 38 / 2 - hyperspaceText.length / 2
      draw2d.text.draw(hyperspaceText, [xPos, 21.5])
    }
    if (game.player.dockingComputerFlightExecuter !== null && flashOn) {
      draw2d.text.draw("DOCKING COMPUTER ON", [9.5, 21.5])
    }

    game.diagnostics
      .map((item, index) => ({ item, index }))
      .forEach(({ item, index }) => {
        draw2d.text.draw(item, [1, index + 1])
      })
  }
}
