import { ShipInstance } from "../model/ShipInstance"
import { Resources } from "../resources/resources"
import { Game } from "../model/game"
import { vec3 } from "gl-matrix"
import { applyDamage, DamageLocationEnum } from "../gameloop/utilities/damage"
import { ShipBlueprint } from "../model/shipBlueprint"
import { pulseLaserMs } from "../model/player"

function calculateLaserDamage(blueprint: ShipBlueprint) {
  // this replicates byte 19 of the ship blueprint in the original game
  const power = blueprint.maxAiMissiles + (blueprint.laserPower << 3)
  return power
}

export function considerFiringMissile(ship: ShipInstance, game: Game, resources: Resources) {}

export function considerFiringLasers(ship: ShipInstance, timeDelta: number, game: Game, resources: Resources) {
  if (ship.blueprint.laserPower <= 0) return
  if (ship.timeUntilCanFireAgain !== null && ship.timeUntilCanFireAgain > 0) {
    ship.timeUntilCanFireAgain -= timeDelta
    if (ship.timeUntilCanFireAgain < 0) {
      ship.timeUntilCanFireAgain = null
    } else {
      return
    }
  } else if (ship.timeLeftFiringLasers !== null && ship.timeLeftFiringLasers > 0) {
    ship.timeLeftFiringLasers -= timeDelta
    if (ship.timeLeftFiringLasers < 0) {
      ship.timeLeftFiringLasers = null
      ship.timeUntilCanFireAgain = pulseLaserMs + (2 - ship.aggressionLevel / 16) * Math.random() // 0.5 + Math.random() * 2.0
    }
    return
  }
  const nosePlayerDotProduct = vec3.dot(vec3.normalize(vec3.create(), ship.position), ship.noseOrientation)
  if (nosePlayerDotProduct < -0.99) {
    ship.timeLeftFiringLasers = 0.3
    const location = applyDamage(game, resources, ship, calculateLaserDamage(ship.blueprint))
    if (location === DamageLocationEnum.Energy) {
      resources.soundEffects.enemyLaserHit()
    } else {
      resources.soundEffects.enemyLaserMiss()
    }
  } else if (nosePlayerDotProduct < -0.97) {
    ship.timeLeftFiringLasers = 0.3
    resources.soundEffects.enemyLaserMiss()
  }
}

export function considerLaunchingEscapePod(ship: ShipInstance, game: Game, resources: Resources) {}
