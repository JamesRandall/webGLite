import { updateShipInstance } from "./updateShipInstance"
import { updateStardust } from "./stardust"
import { updateOrbitalBodies } from "./orbitalBody"
import { Game, SceneEnum } from "../model/game"
import { isShipCollidingWithPlayer } from "./utilities/collisions"
import { ShipRoleEnum } from "../model/ShipInstance"
import { isValidDocking } from "./utilities/docking"
import { vec3 } from "gl-matrix"

export function flightLoop(game: Game, timeDelta: number) {
  game.localBubble.ships.forEach((ship) => {
    updateShipInstance(ship, game.player, timeDelta)
  })
  updateStationAndSafeZone(game)
  updateOrbitalBodies(game, timeDelta)
  updateStardust(game, timeDelta)
  handleCollisions(game)

  // Useful diagnostic when working on manual docking or with the docking computer - shows the station roll and pitch
  //stationPitchAndRoll(game)

  // Another useful docking diagnostic - shows the nose, roll and pitch angles between the player and the station
  //stationAngles(game)

  // And another
  //stationDistance(game)
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
