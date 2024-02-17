import { createTriangleRenderer } from "../primitives/triangle"
import { dimensions } from "../../constants"
import { vec2 } from "gl-matrix"
import { Resources } from "../../resources/resources"
import { Game } from "../../model/game"

export function createLaserRenderer(gl: WebGL2RenderingContext, resources: Resources) {
  let leftLaser = createTriangleRenderer(
    gl,
    dimensions.width,
    dimensions.mainViewHeight,
    [
      vec2.fromValues(50, dimensions.mainViewHeight),
      vec2.fromValues(dimensions.width / 2, dimensions.mainViewHeight / 2),
      vec2.fromValues(100, dimensions.mainViewHeight),
    ],
    resources,
  )

  let rightLaser = createTriangleRenderer(
    gl,
    dimensions.width,
    dimensions.mainViewHeight,
    [
      vec2.fromValues(dimensions.width - 50, dimensions.mainViewHeight + dimensions.crosshairSpace * 2),
      vec2.fromValues(dimensions.width / 2, dimensions.mainViewHeight / 2),
      vec2.fromValues(dimensions.width - 100, dimensions.mainViewHeight + dimensions.crosshairSpace * 2),
    ],
    resources,
  )

  return function renderLasers(game: Game) {
    if (game.player.isLaserActive) {
      leftLaser(game.player.laserOffset, [1.0, 0.0, 0.0, 1.0])
      rightLaser(game.player.laserOffset, [1.0, 0.0, 0.0, 1.0])
    }
  }
}
