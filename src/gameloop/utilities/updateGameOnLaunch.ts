import { Game } from "../../model/game"
import { Resources } from "../../resources/resources"
import { Player } from "../../model/player"
import { vec3 } from "gl-matrix"
import {
  calculateSpaceStationRotationSpeed,
  move,
  rotateLocationInSpaceByPitchAndRoll,
  rotateOrientationVectorsByPitchAndRoll,
} from "./transforms"
import { worldSize } from "../../constants"

export function updateGameOnLaunch(game: Game, resources: Resources) {
  game.localBubble.ships = []

  positionPlayerInOrbit(game)
  spawnSpaceStation(game, resources)
  positionSun(game)
  launchPlayer(game.player)

  // Add the below in if you want to leave aarker for space station roof orientation
  //const cobra = resources.ships.getCobraMk3([1000,1000,1000],[0,0,-1])
  //game.localBubble.ships.push(cobra)
}

function spawnSpaceStation(game: Game, resources: Resources) {
  const station = resources.ships.getCoriolis([0, 0, 0], [0, 0, -1])
  station.position = [0, 0, station.blueprint.renderingModel.boundingBoxSize[1] / 2 + 5]
  station.roll = calculateSpaceStationRotationSpeed(game.player)
  station.aiEnabled = true
  game.localBubble.ships.push(station)
  game.localBubble.station = station
}

function positionPlayerInOrbit(game: Game) {
  const planet = game.localBubble.planet
  const sun = game.localBubble.sun
  const player = game.player
  planet.radius = game.currentSystem.averageRadius // set the planets radius to that of the current system
  // to position the player in orbit what we actually do is move the world bubble so that the player is at
  // a distance of (planet radius * 2) from the planet and facing it
  // to do this we:
  //  1. Move the objects in the world such that the planet is at 0,0,0 along with the player.
  //     In reality we only need to move the sun and the star as we've cleared the ships array at the start of this process
  //  2. Apply a random pitch and roll to the player and move the objects accordingly.
  //     The player doesn't actually move - we just do that rotation as if they did
  //  3. Move the ships in the world such that the planet is at 0,0,-(planetradius*2)

  // Step 1
  const translateDelta = vec3.subtract(vec3.create(), [0, 0, 0], planet.position)
  move(planet, translateDelta)
  //move(sun,translateDelta)

  // Step 2
  const randomRoll = Math.random() * Math.PI * 2
  const randomPitch = Math.random() * Math.PI * 2
  rotateLocationInSpaceByPitchAndRoll(sun, randomRoll, randomPitch)
  rotateOrientationVectorsByPitchAndRoll(sun, randomRoll, randomPitch)

  // Step 3 (we also reset the orientation as the planet will now be directly ahead of the player)
  move(planet, [0, 0, -planet.radius * 2])
  planet.noseOrientation = [0, 0, 1]
  planet.roofOrientation = [0, 1, 0]
  planet.rightOrientation = [1, 0, 0]
  planet.pitch = 0.01
  planet.roll = 0.02
  planet.surfaceTextureIndex = game.currentSystem.surfaceTextureIndex
}

function positionSun(game: Game) {
  const sun = game.localBubble.sun

  const sunDirectionVector = vec3.normalize(vec3.create(), [
    Math.random() * 2 - 1,
    Math.random() * 2 - 1,
    Math.random() * 2 - 1,
  ])
  const approximateDistance = worldSize - 1000000
  const sunPosition = vec3.multiply(vec3.create(), sunDirectionVector, [
    approximateDistance,
    approximateDistance,
    approximateDistance,
  ])
  // orient it to the player
  const sunNoseOrientation = vec3.multiply(vec3.create(), sunDirectionVector, [-1, -1, -1])
  const sunRoofOrientation = vec3.rotateX(vec3.create(), sunNoseOrientation, [0, 0, 0], (90 * Math.PI) / 180)
  const sunRightOrientation = vec3.rotateY(vec3.create(), sunNoseOrientation, [0, 0, 0], (90 * Math.PI) / 180)

  sun.position = sunPosition
  sun.noseOrientation = sunNoseOrientation
  sun.roofOrientation = sunRoofOrientation
  sun.rightOrientation = sunRightOrientation
}

function launchPlayer(player: Player) {
  player.isDocked = false
  player.speed = player.blueprint.maxSpeed * 0.25
  player.roll = calculateSpaceStationRotationSpeed(player)
}
