import { vec2, vec3 } from "gl-matrix"
import { Game, SceneEnum } from "../model/game"
import { stardustJumpSpeedMultiplier } from "../constants"

const maxStars = 128
const timeFromBackToFront = 3.0 // at top speed, so we'd divide this by the players max speed * their actual speed
const distancePerSecond = 1.0 / timeFromBackToFront
const distancePerSecondAtBack = distancePerSecond / 5.0
const visibilityThreshold = 0.6

function createRandomStar(minDistance = 0.0) {
  return vec3.fromValues(Math.random() - 0.5, Math.random() - 0.5, Math.random() * (1.0 - minDistance) + minDistance)
}

export function createStardust() {
  const stars = []
  for (let star = 0; star < maxStars; star++) {
    stars.push(createRandomStar(0.0))
  }
  return stars
}

// TODO: we probably ought to position the stardust deeper into the screen so that it appears behind near objects,
// if we do that we need to remember that we're using a perspective view (by virtue of this following after the ship
// renderer) so we should probably change that or tweak the xy range to be broader so it still covers the display.
export function updateStardust(game: Game, timeDelta: number) {
  const isRearView = game.currentScene === SceneEnum.Rear

  game.localBubble.stardust = game.localBubble.stardust.map((sd) => {
    const z = sd[2]
    const playerSpeed =
      Math.max(game.player.speed / game.player.blueprint.maxSpeed, 0.02) *
      (game.player.isJumping ? stardustJumpSpeedMultiplier : 1)

    if (isRearView) {
      // REAR VIEW: Stars move away from camera
      // Z INCREASES (getting dimmer), XY moves toward center but maintains relative position
      const speed = ((1 - z) * distancePerSecondAtBack * 10 + distancePerSecondAtBack) * timeDelta * playerSpeed
      let newZ = sd[2] + speed // Z increases = gets dimmer

      // Scale XY toward center proportionally (like reverse perspective)
      // Instead of moving toward (0,0), scale down the position
      const scaleFactor = 1 - speed * 2
      let newX = sd[0] * scaleFactor
      let newY = sd[1] * scaleFactor

      const xyLen = Math.sqrt(newX * newX + newY * newY)

      // Reset when star gets too close to center or too dim
      const fadeThreshold = 0.02 + Math.random() * 0.03
      if (xyLen < fadeThreshold || newZ >= 1.0) {
        // Respawn randomly across screen with low Z (bright)
        return vec3.fromValues(Math.random() - 0.5, Math.random() - 0.5, Math.random() * 0.3)
      }

      const newPosition = vec3.fromValues(newX, newY, newZ)

      vec3.rotateZ(newPosition, newPosition, [0, 0, 0], -game.player.roll * timeDelta)
      vec3.add(newPosition, newPosition, [0, game.player.pitch * timeDelta * 2, 0])
      return newPosition
    } else {
      // FRONT VIEW: Stars move toward camera
      // Z DECREASES (getting brighter), XY EXPANDS outward
      const speed = ((1 - z) * distancePerSecondAtBack * 10 + distancePerSecondAtBack) * timeDelta * playerSpeed
      let newZ = sd[2] - speed
      if (newZ <= 0.0) {
        return createRandomStar()
      }
      const xy = vec2.fromValues(sd[0], sd[1])
      vec2.normalize(xy, xy)
      vec2.scale(xy, xy, speed)
      const newPosition = vec3.fromValues(xy[0] + sd[0], xy[1] + sd[1], newZ)
      if (
        newPosition[0] >= -visibilityThreshold &&
        newPosition[0] <= visibilityThreshold &&
        newPosition[1] >= -visibilityThreshold &&
        newPosition[1] <= visibilityThreshold
      ) {
        vec3.rotateZ(newPosition, newPosition, [0, 0, 0], game.player.roll * timeDelta)
        vec3.add(newPosition, newPosition, [0, game.player.pitch * timeDelta * 2, 0])
        return newPosition
      }
      return createRandomStar()
    }
  })
}
