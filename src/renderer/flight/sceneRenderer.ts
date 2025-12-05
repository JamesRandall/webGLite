import { createShipsRenderer } from "./ships"
import { createStardustRenderer } from "./stardust"
import { createSunRenderer } from "./sun"
import { createPrimitiveRenderer } from "../primitives/primitives"
import { Game, SceneEnum } from "../../model/game"
import { createLocalChartRenderer } from "../screens/localChart"
import { createSystemDetailsRenderer } from "../screens/systemDetails"
import { createProjectionMatrix } from "../common"
import { createPlayerDetailsRenderer } from "../screens/playerDetails"
import { createLaunchingRenderer } from "../screens/launching"
import { createHyperspaceRenderer } from "../screens/hyperspace"
import { createSphericalPlanetRenderer } from "./sphericalPlanet"
import { Resources } from "../../resources/resources"
import { createBuyMarketItemsRenderer } from "../screens/buyMarketItems"
import { dimensions } from "../../constants"
import { mat4 } from "gl-matrix"
import { createBuyEquipmentRenderer } from "../screens/buyEquipment"
import { createLongRangeChartRenderer } from "../screens/galaxyChart"
import { createInventoryRenderer } from "../screens/inventory"
import { drawCrosshairs } from "./crosshairs"
import { createPlayerLaserRenderer } from "./playerLasers"
import { createExplosionsRenderer } from "./explosion"
import { createInstructionsRenderer } from "../screens/instructions"

export function createSceneRenderer(gl: WebGL2RenderingContext, resources: Resources) {
  const viewportWidth = dimensions.width
  const viewportHeight = dimensions.mainViewHeight

  const draw2d = createPrimitiveRenderer(gl, false, resources, viewportWidth, viewportHeight)

  const shipRenderer = createShipsRenderer(gl, resources)
  const explosionRenderer = createExplosionsRenderer(gl, resources)
  const stardustRenderer = createStardustRenderer(gl, resources)
  const sunRenderer = createSunRenderer(gl, resources)
  const planetRenderer = createSphericalPlanetRenderer(gl, resources)
  const localChartRenderer = createLocalChartRenderer(draw2d)
  const longRangeChartRenderer = createLongRangeChartRenderer(draw2d)
  const systemDetailsRenderer = createSystemDetailsRenderer(draw2d)
  const playerDetailsRenderer = createPlayerDetailsRenderer(draw2d)
  const launchingRenderer = createLaunchingRenderer(gl, viewportWidth, viewportHeight, resources)
  const hyperspaceRenderer = createHyperspaceRenderer(gl, viewportWidth, viewportHeight, resources)
  const buyMarketItemsRenderer = createBuyMarketItemsRenderer(draw2d)
  const buyEquipmentRenderer = createBuyEquipmentRenderer(draw2d)
  const inventoryRenderer = createInventoryRenderer(draw2d)
  const laserRenderer = createPlayerLaserRenderer(gl, resources)
  const instructionsRenderer = createInstructionsRenderer(gl, resources, draw2d)
  let flashOn = true
  let flashOnTime = 0

  const dispose = () => {
    draw2d.dispose()
    shipRenderer.dispose()
    explosionRenderer.dispose()
    stardustRenderer.dispose()
    sunRenderer.dispose()
    planetRenderer.dispose()
    draw2d.dispose()
  }

  const render = (game: Game, timeDelta: number) => {
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
      case SceneEnum.Rear:
        gl.enable(gl.DEPTH_TEST)
        shipRenderer.render(viewProjectionMatrix, game.localBubble)
        explosionRenderer.render(viewProjectionMatrix, game.localBubble)
        if (!game.isInWitchspace) {
          sunRenderer.render(viewProjectionMatrix, game.localBubble, timeDelta)
          planetRenderer.render(viewProjectionMatrix, game.localBubble, timeDelta)
        }
        stardustRenderer.render(game)
        gl.disable(gl.DEPTH_TEST)
        break

      case SceneEnum.LocalMap:
        localChartRenderer(game)
        break

      case SceneEnum.LongRangeMap:
        longRangeChartRenderer(game)
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
      case SceneEnum.Witchspace:
        hyperspaceRenderer(game)
        break

      case SceneEnum.BuyMarketItems:
        buyMarketItemsRenderer(game, false)
        break

      case SceneEnum.PriceList:
        buyMarketItemsRenderer(game, true)
        break

      case SceneEnum.BuyEquipment:
        buyEquipmentRenderer(game)
        break

      case SceneEnum.Inventory:
        inventoryRenderer(game)
        break

      case SceneEnum.Instructions:
        instructionsRenderer(game)
        break
    }

    gl.disable(gl.DEPTH_TEST)

    drawCrosshairs(draw2d, game)
    laserRenderer.render(game)

    if (game.hyperspace !== null && game.hyperspace.countdown > 0) {
      draw2d.text.draw(game.hyperspace.countdown.toString(), [0.5, 0.5])
      const hyperspaceText = `HYPERSPACE - ${game.player.selectedSystem.name}`
      draw2d.text.center(hyperspaceText, 21.5)
    }
    if (game.player.dockingComputerFlightExecuter !== null && flashOn) {
      draw2d.text.center("DOCKING COMPUTER ON", 21.5)
    }
    if (game.flashMessageIntervals.length > 0 && game.flashMessageIntervals.length % 2 == 0) {
      draw2d.text.center(game.flashMessage, 21.5)
    }

    game.diagnostics
      .map((item, index) => ({ item, index }))
      .forEach(({ item, index }) => {
        draw2d.text.draw(item, [1, index + 1])
      })
  }
  return { render, dispose }
}
