import { frameColor, frameWidth } from "../../constants"
import { Primitives } from "../primitives/primitives"

export function drawHeader(draw2d: Primitives, title: string) {
  draw2d.text.center(title, 0.4)
  draw2d.rect([0, draw2d.text.fontSize.height * 1.5], [draw2d.size().width, frameWidth], frameColor)
}
