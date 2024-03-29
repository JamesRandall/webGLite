import { vec3 } from "gl-matrix"
import { averageSpawnTimeInSecond } from "./constants"
import { Game } from "./model/game"

export function getConstraints(vertices: vec3[]) {
  return vertices.reduce(
    (previous, current) => ({
      min: vec3.fromValues(
        Math.min(previous.min[0], current[0]),
        Math.min(previous.min[1], current[1]),
        Math.min(previous.min[2], current[2]),
      ),
      max: vec3.fromValues(
        Math.max(previous.max[0], current[0]),
        Math.max(previous.max[1], current[1]),
        Math.max(previous.max[2], current[2]),
      ),
    }),
    { min: vec3.fromValues(10000, 10000, 10000), max: vec3.fromValues(-10000, -10000, -10000) },
  )
}

export function createBoundingBox(constraints: { min: vec3; max: vec3 }) {
  const size = getSizeFromConstraints(constraints)
  // If any of the order changes here then update playerWeapons.ts - it relies on the order to determine the faces
  // (we could consider capturing that data here)
  return [
    // Back
    vec3.fromValues(-size[0] / 2, -size[1] / 2, -size[2] / 2),
    vec3.fromValues(size[0] / 2, -size[1] / 2, -size[2] / 2),
    vec3.fromValues(size[0] / 2, size[1] / 2, -size[2] / 2),
    vec3.fromValues(-size[0] / 2, size[1] / 2, -size[2] / 2),
    // Front
    vec3.fromValues(-size[0] / 2, -size[1] / 2, size[2] / 2),
    vec3.fromValues(size[0] / 2, -size[1] / 2, size[2] / 2),
    vec3.fromValues(size[0] / 2, size[1] / 2, size[2] / 2),
    vec3.fromValues(-size[0] / 2, size[1] / 2, size[2] / 2),
  ]
}

export function randomiseSpawnDelta() {
  return averageSpawnTimeInSecond + (Math.random() * 3 - 1)
}

export function getSizeFromConstraints(constraints: { min: vec3; max: vec3 }) {
  return vec3.subtract(vec3.create(), constraints.max, constraints.min)
}

export function toVectorArray(positions: number[]) {
  const result: vec3[] = []
  for (let i = 0; i < positions.length; i += 3) {
    result.push(vec3.fromValues(positions[i], positions[i + 1], positions[i + 2]))
  }
  return result
}

export function createFramerateCounter() {
  const size = 100
  const frameTimes = new Array<number>(size)
  let frameIndex = 0
  return function updateAverageFrameRate(frameTime: number) {
    frameTimes[frameIndex] = frameTime
    frameIndex++
    if (frameIndex === size) {
      frameIndex = 0
    }
    return Math.round(1 / (frameTimes.reduce((a, b) => a + b, 0) / size))
  }
}

export function calculateAltitudeAndMaxAltitude(game: Game) {
  const maxAltitude = game.localBubble.planet.radius * 1.1 // station is at *2 so we put the max a bit higher
  const altitude = Math.max(
    Math.min(vec3.length(game.localBubble.planet.position) - game.localBubble.planet.radius, maxAltitude),
    0,
  )
  return { maxAltitude, altitude }
}
