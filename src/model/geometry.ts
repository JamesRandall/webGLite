import { StarSystem } from "./starSystem"
import { vec2, vec3 } from "gl-matrix"
import { degreesToRadians } from "../gameloop/utilities/transforms"

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

export function calculateOrientationsFromNose(noseOrientation: vec3) {
  const roofOrientation = vec3.rotateX(vec3.create(), noseOrientation, [0, 0, 0], degreesToRadians(-90))
  const sideOrientation = vec3.rotateY(vec3.create(), noseOrientation, [0, 0, 0], degreesToRadians(90))
  return { noseOrientation, roofOrientation, sideOrientation }
}
