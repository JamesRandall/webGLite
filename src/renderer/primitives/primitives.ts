import { createRectRenderer } from "./rectangle"
import { createCircleRenderer } from "./circle"
import { createTextRenderer } from "./text"
import { vec2, vec4 } from "gl-matrix"
import { Size } from "../../model/geometry"
import { Resources } from "../../resources/resources"
import { createTexturedRectRenderer } from "./texturedRectangle"

export interface Primitives {
  rect: (position: vec2, size: vec2, color: vec4) => void
  texturedRect: (position: vec2, size: vec2, texture: WebGLTexture) => void
  circle: (position: vec2, radius: number, color: vec4) => void
  text: {
    draw: (text: string, position: vec2, useCharacterSpace?: boolean, color?: vec4) => void
    measure: (text: string) => Size
    convertToCharacterCoordinates: (position: vec2) => vec2
    convertToPosition: (characterPosition: vec2) => vec2
    drawAtSize: (text: string, position: vec2, cw: number, ch: number, spacing: number, color: vec4) => void
    center: (text: string, row: number, color?: vec4) => void
    fontSize: { width: number; height: number }
  }
  size: () => Size
  dispose: () => void
}

export function createPrimitiveRenderer(
  gl: WebGL2RenderingContext,
  flippedY: boolean,
  resources: Resources,
  width: number,
  height: number,
): Primitives {
  const rr = createRectRenderer(gl, width, height, resources)
  const trr = createTexturedRectRenderer(gl, width, height, resources)
  const cr = createCircleRenderer(gl, width, height, resources)
  const tr = createTextRenderer(gl, width, height, false, resources)
  return {
    rect: rr.render,
    texturedRect: trr.render,
    circle: cr.render,
    text: tr,
    size: () => ({ width: width, height: height }),
    dispose: () => {
      rr.dispose()
      trr.dispose()
      cr.dispose()
      tr.dispose()
    },
  }
}
