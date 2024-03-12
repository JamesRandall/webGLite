import { updateExplosion, updateShipInstance } from "./updateShipInstance"
import { updateStardust } from "./stardust"
import { updateOrbitalBodies } from "./orbitalBody"
import { Game, SceneEnum } from "../model/game"
import { isShipCollidingWithPlayer } from "./utilities/collisions"
import { ShipRoleEnum } from "../model/ShipInstance"
import { isValidDocking } from "./utilities/docking"
import { vec3 } from "gl-matrix"
import { spawnNPCShips } from "./utilities/spawn"
import { Resources } from "../resources/resources"
import { applyTactics } from "./tactics/applyTactics"
import { applyPlayerLasers, applyPlayerMissiles } from "./playerWeapons"
import { replaceDestroyedShipsWithExplosions } from "./explosions"
import { recharge, reduceLaserTemperature } from "./playerEnergy"
import { MissileStatusEnum } from "../model/player"
import { findShipInCrosshairs } from "./utilities/findShipInCrosshairs"
import { damagePlayerWithMissile } from "./utilities/damage"
import { ecmEnergyCostPerSecond, missileDamageAmount } from "../constants"
import { calculateAltitudeAndMaxAltitude } from "../utilities"

function applyEcmCountdown(game: Game, resources: Resources, timeDelta: number) {
  if (game.ecmTimings !== null) {
    const energyDelta = ecmEnergyCostPerSecond * timeDelta
    game.player.energyBankLevel -= energyDelta
    game.ecmTimings.timeRemaining -= timeDelta
    if (game.ecmTimings.timeRemaining > 0) {
      game.ecmTimings.warmUpTimeRemaining -= timeDelta
      if (game.ecmTimings.warmUpTimeRemaining < 0) {
        let destroyCount = game.localBubble.ships.reduce((cnt, s) => {
          if (s.role === ShipRoleEnum.Missile) {
            s.isDestroyed = true
            return cnt + 1
          }
          return cnt
        }, 0)
        if (destroyCount > 0) {
          resources.soundEffects.shipExplosion()
        }
      }
    } else {
      game.ecmTimings = null
    }
  }
}

export function flightLoop(resources: Resources, game: Game, timeDelta: number) {
  let missileTargetShipExists = false
  game.localBubble.ships.forEach((ship) => {
    updateShipInstance(ship, game.player, timeDelta)
    if (ship.id === game.player.missiles.lockedShipId) {
      missileTargetShipExists = true
    }
  })
  if (!missileTargetShipExists && game.player.missiles.lockedShipId !== null) {
    game.player.missiles.lockedShipId = null
    game.player.missiles.status = MissileStatusEnum.Unarmed
  }
  game.localBubble.explosions.forEach((explosion) => updateExplosion(explosion, game.player, timeDelta))
  updateStationAndSafeZone(game)
  updateOrbitalBodies(game, timeDelta)
  updateStardust(game, timeDelta)
  handleCollisions(game, resources)
  applyPlayerLasers(game, resources, timeDelta)
  applyPlayerMissiles(game, resources, timeDelta)
  spawnNPCShips(resources, game, timeDelta)
  applyTactics(game, resources, timeDelta)
  lockPlayerMissiles(game, resources)
  applyEcmCountdown(game, resources, timeDelta) // this is here rather than the flight loop because it can also be triggered by enemy ships

  // this should be done at the end of the loop
  replaceDestroyedShipsWithExplosions(game, timeDelta)
  recharge(game.player, timeDelta)
  reduceLaserTemperature(game.player, timeDelta)
  checkAltitude(game)

  // Useful diagnostic when working on manual docking or with the docking computer - shows the station roll and pitch
  //stationPitchAndRoll(game)

  // Another useful docking diagnostic - shows the nose, roll and pitch angles between the player and the station
  //stationAngles(game)

  // And another
  //stationDistance(game)
}

function checkAltitude(game: Game) {
  const { altitude } = calculateAltitudeAndMaxAltitude(game)
  if (altitude <= 0) {
    game.currentScene = SceneEnum.PlayerExploding
  }
}

function lockPlayerMissiles(game: Game, resources: Resources) {
  if (game.player.missiles.status === MissileStatusEnum.Armed) {
    const target = findShipInCrosshairs(game)
    if (target !== null) {
      game.player.missiles.lockedShipId = target.id
      game.player.missiles.status = MissileStatusEnum.Locked
      resources.soundEffects.missileTarget()
    }
  }
}

function updateStationAndSafeZone(game: Game) {
  if (game.localBubble.station !== null) {
    const distance = vec3.length(game.localBubble.station.position)
    game.player.isInSafeZone = distance < game.localBubble.planet.radius * 2
    //if (distance > game.localBubble.planet.radius * 2) {
    //    game.localBubble.ships = game.localBubble.ships.filter(s => s.role !== ShipRoleEnum.Station)
    //    game.localBubble.station = null
    //}
  }
}

function handleCollisions(game: Game, resources: Resources) {
  game.localBubble.ships.forEach((ship) => {
    if (ship.role === ShipRoleEnum.Missile && ship.tacticsState.targetIndex !== null && !ship.isDestroyed) {
      // if we're a missile that has been fired at another ship then we just do a simple range
      // check for a collision against the other ships
      const missileSize = Math.max(...ship.blueprint.renderingModel.boundingBoxSize)
      game.localBubble.ships.forEach((otherShip) => {
        if (otherShip.isDestroyed || otherShip.id === ship.id) {
          return
        }
        const distance = vec3.length(vec3.subtract(vec3.create(), ship.position, otherShip.position))
        if (distance < (Math.max(...otherShip.blueprint.renderingModel.boundingBoxSize) + missileSize) / 2) {
          otherShip.energy -= missileDamageAmount
          if (otherShip.energy <= 0) {
            otherShip.isDestroyed = true
            otherShip.energy = 0
          }
          ship.isDestroyed = true
          resources.soundEffects.shipExplosion()
        }
      })
    } else if (isShipCollidingWithPlayer(ship)) {
      console.log(`COLLISION - ${ship.blueprint.name}`)
      if (ship.role === ShipRoleEnum.Station) {
        if (isValidDocking(game)) {
          game.currentScene = SceneEnum.Docking
        } else {
          game.currentScene = SceneEnum.PlayerExploding
        }
        return
      } else if (ship.role === ShipRoleEnum.Missile) {
        damagePlayerWithMissile(game, resources, ship)
      }
    }
  })
}
