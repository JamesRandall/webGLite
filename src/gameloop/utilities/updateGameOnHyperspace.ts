import { Game, SceneEnum } from "../../model/game"
import { Resources } from "../../resources/resources"
import { vec2, vec3 } from "gl-matrix"
import {
  calculateSpaceStationPlanetDistance,
  calculateSpaceStationRotationSpeed,
  degreesToRadians,
  rotateLocationInSpaceByPitchAndRoll,
  rotateOrientationVectorsByPitchAndRoll,
} from "./transforms"
import { scannerRadialWorldRange, worldSize } from "../../constants"
import { generateMarketItems } from "../../proceduralGeneration/marketItems"
import { ShipModelEnum } from "../../model/shipBlueprint"
import { AttitudeEnum, ShipRoleEnum } from "../../model/ShipInstance"
import { aiFlag } from "../tactics/common"

export function updateGameOnHyperspace(game: Game, resources: Resources) {
  game.isInWitchspace = game.currentScene === SceneEnum.Witchspace
  game.disableSpawning = game.isInWitchspace
  // the original game would consume the players fuel when they got sucked into witchspace that left them stranded
  // and unable to get back out if they didn't have enough fuel. Instead we take fuel for a third of the distance
  // making it much more likely they can escape
  const distance =
    vec2.distance(game.currentSystem.galacticPosition, game.player.selectedSystem.galacticPosition) /
    (game.isInWitchspace ? 3 : 1)
  game.player.fuel = Math.max(0, game.player.fuel - Math.floor(distance * 10))
  game.hyperspace = null
  game.currentSystem = game.player.selectedSystem
  game.localBubble.ships = []
  game.localBubble.station = null

  positionPlayerAwayFromPlanet(game)
  positionSun(game)
  if (game.isInWitchspace) {
    spawnThargoids(game, resources)
  } else {
    spawnStationInOrbit(game, resources)
  }

  game.marketItems = generateMarketItems(game.currentSystem)
}

// TODO: come back to the below when fresher, I've a horrible feeling its nonsense

function positionPlayerAwayFromPlanet(game: Game) {
  const planet = game.localBubble.planet
  planet.radius = game.currentSystem.averageRadius

  // create a random directional vector for the planet then move it to a random distance suitable for hyperspace
  // exit along that vector
  // we place the planet roughly in front of the player
  const planetDirectionVector = vec3.normalize(vec3.create(), [
    Math.random() * 2 - 1,
    Math.random() * 2 - 1,
    Math.random() - 1,
  ])
  const approximateDistance = worldSize / (Math.random() * 192 + 96)
  const planetPosition = vec3.multiply(vec3.create(), planetDirectionVector, [
    approximateDistance,
    approximateDistance,
    approximateDistance,
  ])
  // orient it to the player
  const planetNoseOrientation = vec3.multiply(vec3.create(), planetDirectionVector, [-1, -1, -1])
  const planetRoofOrientation = vec3.rotateX(vec3.create(), planetNoseOrientation, [0, 0, 0], (90 * Math.PI) / 180)
  const planetRightOrientation = vec3.rotateY(vec3.create(), planetNoseOrientation, [0, 0, 0], (90 * Math.PI) / 180)

  planet.position = planetPosition
  planet.noseOrientation = planetNoseOrientation
  planet.roofOrientation = planetRoofOrientation
  planet.rightOrientation = planetRightOrientation
  planet.pitch = 0.01
  planet.roll = 0.02
  planet.surfaceTextureIndex = game.currentSystem.surfaceTextureIndex
}

function spawnStationInOrbit(game: Game, resources: Resources) {
  const distance = calculateSpaceStationPlanetDistance(game)

  // 1. Position the station a random direction away from the planet but on the player side of the planet
  const randomDirection = vec3.normalize(
    vec3.create(),
    vec3.fromValues(Math.random() * 2 - 1, Math.random() * 2 - 1, -Math.random()),
  )
  const translation = vec3.multiply(vec3.create(), randomDirection, [distance, distance, distance])
  const position = vec3.add(vec3.create(), game.localBubble.planet.position, translation)
  const station = resources.ships.getCoriolis([0, 0, 0], [0, 0, -1])
  station.position = position
  station.aiEnabled = true
  station.roll = calculateSpaceStationRotationSpeed(game.player)
  // 2. Orient the station so that the gate is facing the planet
  station.noseOrientation = vec3.multiply(vec3.create(), randomDirection, [-1, -1, -1])
  station.roofOrientation = vec3.rotateX(vec3.create(), station.noseOrientation, [0, 0, 0], degreesToRadians(-90))
  station.rightOrientation = vec3.rotateY(vec3.create(), station.noseOrientation, [0, 0, 0], degreesToRadians(90))

  game.localBubble.ships.push(station)
  game.localBubble.station = station
}

function positionSun(game: Game) {
  const sun = game.localBubble.sun

  // roughly behind the player
  sun.position = vec3.fromValues(0, 0, worldSize + 1000)
  sun.noseOrientation = vec3.fromValues(0, 0, 1)
  sun.roofOrientation = vec3.fromValues(0, 1, 0)
  sun.rightOrientation = vec3.fromValues(1, 0, 0)

  const randomPitch = Math.random() * (45 * (Math.PI / 180))
  const randomRoll = Math.random() * (45 * (Math.PI / 180))
  rotateLocationInSpaceByPitchAndRoll(sun, randomRoll, randomPitch)
  rotateOrientationVectorsByPitchAndRoll(sun, randomRoll, randomPitch)

  game.localBubble.sun.initialOrientation = vec3.normalize(
    vec3.create(),
    vec3.subtract(vec3.create(), game.localBubble.planet.position, game.localBubble.sun.position),
  )
}

function spawnThargoids(game: Game, resources: Resources) {
  const numberToSpawn = Math.floor(Math.random() * 3) + 1
  const range = scannerRadialWorldRange
  for (let i = 0; i < numberToSpawn; i++) {
    const position = vec3.fromValues(
      Math.floor(Math.random() * range[0] * 2) - range[0],
      Math.floor(Math.random() * range[1] * 2) - range[1],
      Math.floor(Math.random() * range[2] * 2) - range[2],
    )
    const facing = vec3.normalize(vec3.create(), vec3.multiply(vec3.create(), position, [-1, -1, -1]))
    const thargoid = resources.ships.getInstanceOfModel(ShipModelEnum.Thargoid, position, facing)
    thargoid.aiEnabled = true
    thargoid.aggressionLevel = 31
    thargoid.role = ShipRoleEnum.Pirate
    thargoid.attitude = AttitudeEnum.Hostile
    thargoid.hasECM = Math.random() > 0.5
    game.localBubble.ships.push(thargoid)
  }
}
