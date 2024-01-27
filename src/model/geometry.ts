import { StarSystem } from "./starSystem"
import { vec2 } from "gl-matrix"

export interface Size {
  width: number
  height: number
}

export interface Point {
  x: number
  y: number
}

export interface Rect {
  left: number
  top: number
  width: number
  height: number
}

export function isPointInRect(pt: vec2, rect: Rect) {
  return pt[0] >= rect.left && pt[0] < rect.left + rect.width && pt[1] >= rect.top && pt[1] < rect.top + rect.height
}

export function distance(p1: Point, p2: Point) {
  const xDelta = p2.x - p1.x
  const yDelta = p2.y - p1.y
  return Math.sqrt(xDelta * xDelta + yDelta * yDelta)
}
