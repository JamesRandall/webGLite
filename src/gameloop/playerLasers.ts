import { Game, SceneEnum } from "../model/game"
import { pulseLaserMs } from "../model/player"
import { vec2, vec3 } from "gl-matrix"
import { dimensions } from "../constants"
import { ShipInstance } from "../model/ShipInstance"
import { log } from "../gameConsole"
import { Resources } from "../resources/resources"

export function applyPlayerLasers(game: Game, resources: Resources, timeDelta: number) {
  const laserEnergy = 1

  const previousActiveState = game.player.isLaserActive
  // the laser pulse state change is always running - this stops players from tapping the fire key quickly
  // to shoot fire than the interval allows
  game.player.timeToLaserStateChange -= timeDelta

  // this block of code prevents the player from hammering the fire key for faster firing
  if (!game.player.isLaserFiring) {
    // if we were firing and the players laser was active then we need to make sure we wait a full laser pulse
    // until we can fire again
    if (game.player.previousControlState.firing && game.player.isLaserActive) {
      game.player.timeToLaserStateChange += pulseLaserMs
    }
    // if we're not firing then stop the counter at zero - this means that when the player fires again
    // we won't wait for the next pulse but will do so immediately
    if (game.player.timeToLaserStateChange < 0) {
      game.player.timeToLaserStateChange = 0
    }
    game.player.isLaserActive = false
    return
  }

  // handle an actual firing situation
  if (game.player.timeToLaserStateChange < 0) {
    game.player.timeToLaserStateChange = pulseLaserMs

    game.player.isLaserActive = !game.player.isLaserActive
    if (game.player.isLaserActive && game.player.energyBankLevel <= laserEnergy + 1) {
      game.player.isLaserActive = false
    }
    if (game.player.isLaserActive && !previousActiveState) {
      // we "fire" when the pulse turns on
      game.player.laserTemperature++
      game.player.energyBankLevel -= laserEnergy
      if (game.player.laserTemperature === game.player.blueprint.maxLaserTemperature) {
        game.currentScene = SceneEnum.PlayerExploding
      }
      game.player.laserOffset = vec2.fromValues(
        (dimensions.crosshairSpace / 2) * Math.random() - dimensions.crosshairSpace / 4,
        (dimensions.crosshairSpace / 2) * Math.random() - dimensions.crosshairSpace / 4,
      )
      processLaserHits(game, resources)
    }
  }
}

function createLaserCollisionQuad(ship: ShipInstance) {
  const xy = (v: vec3) => vec2.fromValues(v[0], v[1])
  const translatedBoundingBox = ship.boundingBox.map((v) => vec3.add(vec3.create(), v, ship.position))

  return translatedBoundingBox.reduce(
    ([leftMost, rightMost, topMost, bottomMost], v) => [
      v[0] < leftMost[0] ? xy(v) : leftMost,
      v[0] > rightMost[0] ? xy(v) : rightMost,
      v[1] > topMost[1] ? xy(v) : topMost,
      v[1] < bottomMost[1] ? xy(v) : bottomMost,
    ],
    [vec2.fromValues(10000, 0), vec2.fromValues(-10000, 0), vec2.fromValues(0, -10000), vec2.fromValues(0, 10000)],
  )
}

function createTrianglesFromQuad(quad: vec2[]) {
  return [
    [quad[0], quad[1], quad[2]],
    [quad[2], quad[3], quad[0]],
  ]
}

// barycentric approach
function isPointInTriangle(point: vec2, [p1, p2, p3]: vec2[]) {
  let a =
    ((p2[1] - p3[1]) * (point[0] - p3[0]) + (p3[0] - p2[0]) * (point[1] - p3[1])) /
    ((p2[1] - p3[1]) * (p1[0] - p3[0]) + (p3[0] - p2[0]) * (p1[1] - p3[1]))
  let b =
    ((p3[1] - p1[1]) * (point[0] - p3[0]) + (p1[0] - p3[0]) * (point[1] - p3[1])) /
    ((p2[1] - p3[1]) * (p1[0] - p3[0]) + (p3[0] - p2[0]) * (p1[1] - p3[1]))
  let c = 1.0 - a - b
  return a >= 0 && a <= 1 && b >= 0 && b <= 1 && c >= 0 && c <= 1
}

function processLaserHits(game: Game, resources: Resources) {
  // all we are really interested in for deciding if a player has hit a ship is the intersection of the bounding
  // box of the ship onto a 2d plane. That results in a quad that we can then split into two triangles and use
  // barycentric co-ordinates to determine if the laser has hit the ship
  // this isn't how the original did it - it used some bit tricks basically

  const hit = game.localBubble.ships.reduce((hit: ShipInstance | null, ship) => {
    if (ship.position[2] > 0) return hit
    if (hit !== null && hit.position[2] > ship.position[2]) return hit
    const quad = createLaserCollisionQuad(ship)
    const triangles = createTrianglesFromQuad(quad)
    //const testPoint = game.player.laserOffset
    const testPoint = vec2.fromValues(0, 0)
    if (isPointInTriangle(testPoint, triangles[0]) || isPointInTriangle(testPoint, triangles[1])) {
      return ship
    }
    return hit
  }, null)
  if (hit === null) {
    resources.soundEffects.playerLaserMiss()
  } else {
    hit.isDestroyed = true
    resources.soundEffects.shipExplosion()
  }
}
