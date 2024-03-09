import { StarSystem } from "./starSystem"
import { mat4, quat, vec2, vec3, vec4 } from "gl-matrix"
import { degreesToRadians } from "../gameloop/utilities/transforms"
import { dimensions } from "../constants"

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
  const startingNoseOrientation = vec3.fromValues(0, 0, -1)
  const startingRoofOrientation = vec3.fromValues(0, 1, 0)
  const startingRightOrientation = vec3.fromValues(-1, 0, 0)

  const rotation = quat.rotationTo(quat.create(), startingNoseOrientation, noseOrientation)
  const matrix = mat4.fromQuat(mat4.create(), rotation)
  const newNoseOrientation = vec3.transformMat4(vec3.create(), startingNoseOrientation, matrix)
  const newRoofOrientation = vec3.transformMat4(vec3.create(), startingRoofOrientation, matrix)
  const newRightOrientation = vec3.transformMat4(vec3.create(), startingRightOrientation, matrix)

  return {
    noseOrientation: newNoseOrientation,
    roofOrientation: newRoofOrientation,
    sideOrientation: newRightOrientation,
  }
}

export function projectPosition(p: vec3, projectionMatrix: mat4) {
  const position = vec4.fromValues(p[0], p[1], p[2], 0)
  const projectedPosition = vec4.transformMat4(vec4.create(), position, projectionMatrix)
  const x = projectedPosition[0] / projectedPosition[3]
  const y = projectedPosition[1] / projectedPosition[3]
  const viewportX = ((x + 1) / 2) * dimensions.width
  const viewportY = ((1 - y) / 2) * dimensions.mainViewHeight
  return vec2.fromValues(viewportX, viewportY)
}
