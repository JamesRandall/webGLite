import { Primitives } from "../primitives/primitives"
import { Game } from "../../model/game"
import { frameColor, frameWidth } from "../../constants"
import { CombatRatingEnum, LaserTypeEnum, LegalStatusEnum } from "../../model/player"
import { createPolygonRenderer } from "../primitives/polygon"
import { vec2, vec4 } from "gl-matrix"
import { Resources } from "../../resources/resources"

export function createHyperspaceRenderer(
  gl: WebGLRenderingContext,
  width: number,
  height: number,
  resources: Resources,
) {
  const octRenderer = createPolygonRenderer(gl, width, height, 8, resources)
  const centerX = width / 2
  const centerY = height / 2
  const maxRadius = Math.max(centerX, centerY) * 1.2
  const colors = [
    vec4.fromValues(1, 1, 0, 1),
    vec4.fromValues(1, 0, 0, 1),
    vec4.fromValues(0, 1, 0, 1),
    vec4.fromValues(0, 0, 1, 1),
    vec4.fromValues(0, 1, 1, 1),
  ]
  return function renderHyperspace(game: Game) {
    if (game.hyperspace === null) {
      return
    }

    let rotationIndex = 0
    game.hyperspace.outboundRadii.forEach((radius) => {
      const rotation = ((20 * Math.PI) / 180) * rotationIndex
      rotationIndex++
      if (rotationIndex > game.hyperspace!.rotation) {
        rotationIndex = game.hyperspace!.rotation
      }
      const color = colors[Math.floor(Math.random() * (colors.length - 1))]
      //octRenderer([centerX, centerY], radius*maxRadius, color, rotation)
      octRenderer([centerX, centerY], radius * maxRadius, color, rotation)
    })
    rotationIndex = 0
    game.hyperspace.inboundRadii.forEach((radius) => {
      const rotation = ((20 * Math.PI) / 180) * rotationIndex
      rotationIndex++
      if (rotationIndex > game.hyperspace!.rotation) {
        rotationIndex = game.hyperspace!.rotation
      }
      octRenderer([centerX, centerY], radius * maxRadius, vec4.fromValues(0, 0, 0, 1), rotation)
    })
  }
}
