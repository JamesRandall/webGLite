import { createShipsRenderer } from "../flight/ships"
import { createPrimitiveRenderer } from "../primitives/primitives"
import { Game, SceneEnum } from "../../model/game"
import { createProjectionMatrix, drawFrame, setupGl } from "../common"
import { Resources } from "../../resources/resources"
import { dimensions } from "../../constants"
import { createInitialLoadoutRenderer } from "./initialLoadout"

export function createPregameSceneRenderer(gl: WebGL2RenderingContext, resources: Resources) {
  const shipRenderer = createShipsRenderer(gl, resources, true)
  const draw2d = createPrimitiveRenderer(gl, false, resources, dimensions.width, dimensions.mainViewHeight)
  const loadoutEditorRenderer = createInitialLoadoutRenderer(draw2d)

  return (game: Game, timeDelta: number) => {
    const projectionMatrix = createProjectionMatrix(
      dimensions.width,
      dimensions.mainViewHeight,
      game.localBubble.clipSpaceRadius,
    )

    setupGl(gl)
    if (game.currentScene === SceneEnum.LoadoutEditor) {
      loadoutEditorRenderer(game)
    } else {
      gl.enable(gl.DEPTH_TEST)
      shipRenderer(projectionMatrix, game.localBubble)
      gl.disable(gl.DEPTH_TEST)
      draw2d.text.center("---- webGLite ----", 1)
      draw2d.text.center("based on Elite", 2.5)
      draw2d.text.center("by Ian Bell and David Braben", 4)
      if (game.message !== null) {
        draw2d.text.center(game.message, 21)
      }
    }

    drawFrame(draw2d)
  }
}
