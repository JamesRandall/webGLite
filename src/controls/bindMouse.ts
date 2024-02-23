import { Player } from "../model/player"
import { ControlState } from "./controlState"
import { vec2 } from "gl-matrix"

export function bindMouse(controlState: ControlState) {
  const mouseMove = (e: MouseEvent) => (controlState.mousePosition = vec2.fromValues(e.offsetX, e.offsetY))
  const mouseDown = () => (controlState.mouseDown = true)
  const mouseUp = () => (controlState.mouseDown = false)

  window.addEventListener("mousemove", mouseMove)
  window.addEventListener("mousedown", mouseDown)
  window.addEventListener("mouseup", mouseUp)

  return () => {
    window.removeEventListener("mousedown", mouseDown)
    window.removeEventListener("mouseup", mouseUp)
    window.removeEventListener("mousemove", mouseMove)
  }
}
