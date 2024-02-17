import { updateShipInstance } from "./updateShipInstance"
import { updateStardust } from "./stardust"
import { updateOrbitalBodies } from "./orbitalBody"
import { Game, SceneEnum } from "../model/game"
import { isShipCollidingWithPlayer } from "./utilities/collisions"
import { ShipRoleEnum } from "../model/ShipInstance"
import { isValidDocking } from "./utilities/docking"
import { vec2, vec3 } from "gl-matrix"
import { spawnNPCShips } from "./utilities/spawn"
import { Resources } from "../resources/resources"
import { applyTactics } from "../tactics/applyTactics"
import { dimensions } from "../constants"
import { pulseLaserMs } from "../model/player"

export function flightLoop(resources: Resources, game: Game, timeDelta: number) {
  game.localBubble.ships.forEach((ship) => {
    updateShipInstance(ship, game.player, timeDelta)
  })
  updateStationAndSafeZone(game)
  updateOrbitalBodies(game, timeDelta)
  updateStardust(game, timeDelta)
  handleCollisions(game)
  applyPlayerLasers(game, timeDelta)
  spawnNPCShips(resources, game, timeDelta)
  applyTactics(game, resources, timeDelta)

  // Useful diagnostic when working on manual docking or with the docking computer - shows the station roll and pitch
  //stationPitchAndRoll(game)

  // Another useful docking diagnostic - shows the nose, roll and pitch angles between the player and the station
  //stationAngles(game)

  // And another
  //stationDistance(game)
}

function applyPlayerLasers(game: Game, timeDelta: number) {
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
      game.player.energyBankLevel -= 8
      if (game.player.laserTemperature === game.player.blueprint.maxLaserTemperature) {
        game.currentScene = SceneEnum.PlayerExploding
      }
      game.player.laserOffset = vec2.fromValues(
        (dimensions.crosshairSpace / 2) * Math.random() - dimensions.crosshairSpace / 4,
        (dimensions.crosshairSpace / 2) * Math.random() - dimensions.crosshairSpace / 4,
      )
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

function handleCollisions(game: Game) {
  game.localBubble.ships.forEach((ship) => {
    if (isShipCollidingWithPlayer(ship)) {
      console.log(`COLLISION - ${ship.blueprint.name}`)
      if (ship.role === ShipRoleEnum.Station) {
        if (isValidDocking(game)) {
          game.currentScene = SceneEnum.Docking
        } else {
          game.currentScene = SceneEnum.PlayerExploding
        }
        return
      }
    }
  })
}
