import { createShipsRenderer } from "../flight/ships"
import { createPrimitiveRenderer } from "../primitives/primitives"
import { Game } from "../../model/game"
import { createProjectionMatrix, drawFrame, setupGl } from "../common"
import { Resources } from "../../resources/resources"
import { dimensions } from "../../constants"

export function createPregameSceneRenderer(gl: WebGL2RenderingContext, resources: Resources) {
  const shipRenderer = createShipsRenderer(gl, resources, true)
  const draw2d = createPrimitiveRenderer(gl, false, resources, dimensions.width, dimensions.mainViewHeight)

  return (game: Game, timeDelta: number) => {
    const projectionMatrix = createProjectionMatrix(
      dimensions.width,
      dimensions.mainViewHeight,
      game.localBubble.clipSpaceRadius,
    )

    setupGl(gl)
    gl.enable(gl.DEPTH_TEST)
    shipRenderer(projectionMatrix, game.localBubble)
    gl.disable(gl.DEPTH_TEST)
    drawFrame(draw2d)
    draw2d.text.center("---- webGLite ----", 1)
    draw2d.text.center("based on Elite", 2.5)
    draw2d.text.center("by Ian Bell and David Braben", 4)
    draw2d.text.center("Press Space Or Fire, Commander", 21)
  }
}
