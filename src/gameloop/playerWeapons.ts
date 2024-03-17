import { Game, SceneEnum } from "../model/game"
import { getLaserForScene, getLaserFrequency, LaserTypeEnum, MissileStatusEnum } from "../model/player"
import { vec2 } from "gl-matrix"
import { dimensions, laserMaxTemperature, laserTemperaturePerPulse } from "../constants"
import { AttitudeEnum, FlyingTowardsEnum, ShipRoleEnum } from "../model/ShipInstance"
import { Resources } from "../resources/resources"
import { applyDamageToNpcWithLasers } from "./utilities/damage"
import { findShipInCrosshairs } from "./utilities/findShipInCrosshairs"
import { ShipModelEnum } from "../model/shipBlueprint"

export function applyPlayerMissiles(game: Game, resources: Resources, timeDelta: number) {
  if (
    game.player.controlState.fireMissile &&
    !game.player.previousControlState.fireMissile &&
    game.player.missiles.status === MissileStatusEnum.Locked
  ) {
    const missile = resources.ships.getInstanceOfModel(ShipModelEnum.Missile, [0, 0, -2], [0, 0, -1])
    missile.role = ShipRoleEnum.Missile
    missile.speed = missile.blueprint.maxSpeed
    missile.aiEnabled = true
    missile.tacticsState.flyingTowards = FlyingTowardsEnum.ToTarget
    missile.tacticsState.targetIndex = game.player.missiles.lockedShipId
    game.localBubble.ships.push(missile)

    game.player.missiles.currentNumber--
    game.player.missiles.status = MissileStatusEnum.Unarmed

    resources.soundEffects.missileLaunch()
  }
}

export function applyPlayerLasers(game: Game, resources: Resources, timeDelta: number) {
  const laserType = getLaserForScene(game)
  if (laserType === LaserTypeEnum.None) {
    game.player.isLaserActive = false
    return
  }

  if (game.player.laserTemperature > laserMaxTemperature && !game.player.isLaserActive) {
    // if the laser is "on" we let it turn off before stopping it turning on again when overheating
    return
  }

  const laserEnergy = 1
  const laserFrequency = getLaserFrequency(laserType)

  const previousActiveState = game.player.isLaserActive
  // the laser pulse state change is always running - this stops players from tapping the fire key quickly
  // to shoot fire than the interval allows
  game.player.timeToLaserStateChange -= timeDelta

  // this block of code prevents the player from hammering the fire key for faster firing
  if (!game.player.isLaserFiring) {
    // if we were firing and the players laser was active then we need to make sure we wait a full laser pulse
    // until we can fire again
    if (game.player.previousControlState.firing && game.player.isLaserActive) {
      game.player.timeToLaserStateChange += laserFrequency
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
    game.player.timeToLaserStateChange = laserFrequency

    game.player.isLaserActive = !game.player.isLaserActive
    if (game.player.isLaserActive && game.player.energyBankLevel <= laserEnergy + 1) {
      game.player.isLaserActive = false
    }
    if (game.player.isLaserActive && !previousActiveState) {
      // we "fire" when the pulse turns on
      game.player.laserTemperature += laserTemperaturePerPulse
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

function processLaserHits(game: Game, resources: Resources) {
  // all we are really interested in for deciding if a player has hit a ship is the intersection of the bounding
  // box of the ship onto a 2d plane. To do this we take each face of the bounding box, discard the z, and look to see
  // if our laser axis (represented by point [0,0]) falls within it by breaking the face into two and using
  // barycentric co-ordinates to see if we are in the triangle

  const hit = findShipInCrosshairs(game)
  if (hit === null) {
    resources.soundEffects.playerLaserMiss()
  } else {
    if (hit.role !== ShipRoleEnum.Station) {
      applyDamageToNpcWithLasers(game, resources, hit)
    }
    if (hit.attitude === AttitudeEnum.Friendly) {
      // if we've hit a friendly ship make it hostile and aggressive
      hit.attitude = AttitudeEnum.Hostile
      hit.aiEnabled = true
      if (hit.aggressionLevel < 20) {
        hit.aggressionLevel = 20 + Math.floor(Math.random() * 11)
      }
    }

    if (hit.isDestroyed) {
      resources.soundEffects.shipExplosion()
    } else {
      resources.soundEffects.playerLaserHit()
    }
    //
  }
}
