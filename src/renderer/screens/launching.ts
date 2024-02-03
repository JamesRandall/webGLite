import { Primitives } from "../primitives/primitives"
import { Game } from "../../model/game"
import { dimensions, frameColor, frameWidth } from "../../constants"
import { CombatRatingEnum, LaserTypeEnum, LegalStatusEnum } from "../../model/player"
import { createPolygonRenderer } from "../primitives/polygon"
import { vec2, vec4 } from "gl-matrix"
import { Resources } from "../../resources/resources"

export function createLaunchingRenderer(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  resources: Resources,
) {
  const octRenderer = createPolygonRenderer(gl, width, height, 8, resources)
  const centerX = dimensions.width / 2
  const centerY = dimensions.mainViewHeight / 2
  const maxRadius = Math.max(centerX, centerY) * 1.2
  return function renderLaunch(game: Game) {
    if (game.launching === null) {
      return
    }

    game.launching.outboundRadii.forEach((radius) => {
      octRenderer([centerX, centerY], radius * maxRadius, vec4.fromValues(1, 1, 1, 1))
      octRenderer([centerX, centerY], radius * maxRadius - 2, vec4.fromValues(0, 0, 0, 1))
    })
    game.launching.inboundRadii.forEach((radius) => {
      octRenderer([centerX, centerY], radius * maxRadius, vec4.fromValues(0, 0, 0, 1))
    })
  }
}
