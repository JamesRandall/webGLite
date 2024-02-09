import { Game } from "../../model/game"
import { randomiseSpawnDelta } from "../../utilities"
import { ShipInstance, ShipRoleEnum } from "../../model/ShipInstance"
import { vec3 } from "gl-matrix"
import { scannerRadialWorldRange } from "../../constants"
import { Resources } from "../../resources/resources"
import { GovernmentEnum } from "../../model/starSystem"
import { log } from "../../gameConsole"

// this is heavily based on the main loop in the original game amazingly documented here by Mark Moxon:
// https://www.bbcelite.com/master/main/subroutine/main_game_loop_part_2_of_6.html

const spawnSequence = [spawnDockingTrader, spawnFriendly, spawnCop, spawnEnemy]

export function spawnNPCShips(resources: Resources, game: Game, timeDelta: number) {
  if (game.disableSpawning) return
  if (game.player.isDocked) return
  // when we are jumping we spawn more often
  game.timeUntilNextSpawnChance -= timeDelta * (game.player.isJumping ? 2 : 1)
  if (game.timeUntilNextSpawnChance > 0) return

  log("Beginning spawn")
  game.timeUntilNextSpawnChance = randomiseSpawnDelta()
  spawnSequence.reduce((result, func) => (result ? result : func(resources, game)), false)
}

function spawnDockingTrader(resources: Resources, game: Game) {
  log("Chance to spawn docking trader")
  if (!game.player.isInSafeZone) return false
  if (Math.random() > 0.25) return false
  if (countOfJunkInLocalBubble(game) >= 3) return false

  // we need to spawn a trader and attach the docking computer flight path to it

  //return false
  return true
}

function spawnFriendly(resources: Resources, game: Game) {
  log("Chance to spawn friendly")
  if (Math.random() > 0.13) return false
  if (countOfJunkInLocalBubble(game) >= 3) return false

  // we place a friendly object roughly in front of the player heading towards the player just outside of the scanner range
  const range = scannerRadialWorldRange[0] / 2
  const position = vec3.fromValues(
    Math.random() * range - range / 2,
    Math.random() * range - range / 2,
    -scannerRadialWorldRange[2] * 1.2,
  )
  const noseOrientation = vec3.fromValues(0, 0, 1)

  if (Math.random() > 0.5) spawnInstanceOfTrader(resources, game, position, noseOrientation)
  else if (Math.random() < 0.985) spawnInstanceOfAsteroidOrBoulder(resources, game, position, noseOrientation)
  else spawnInstanceOfCargo(resources, game, position, noseOrientation)

  return true
}

function spawnCop(resources: Resources, game: Game) {
  return false
}

function spawnEnemy(resources: Resources, game: Game) {
  log("Chance to spawn enemy")
  if (game.player.isInSafeZone) return false
  game.extraVesselsSpawningDelay--
  if (game.extraVesselsSpawningDelay >= 0) return false
  game.extraVesselsSpawningDelay = 0
  const randomFactor = Math.round(Math.random() * 255)
  const governmentCompare = randomFactor & 7
  if (game.currentSystem.government !== GovernmentEnum.Anarchy) {
    if (randomFactor > 90) return false
    if (governmentCompare < game.currentSystem.government) return false
  }

  if (governmentCompare < game.currentSystem.government && game.currentSystem.government !== GovernmentEnum.Anarchy)
    return false

  if (Math.random() > 0.39) {
    // spawn pirates
    const numberOfPirates = Math.round(Math.random() * 4)
    console.log(`Spawning ${numberOfPirates} pirates`)
    game.extraVesselsSpawningDelay += numberOfPirates
    const centerPosition = randomPositionInFrontOfPlayer()
    const rangeFromCenter = 1000
    for (let pirateIndex = 0; pirateIndex < numberOfPirates; pirateIndex++) {
      const position = vec3.fromValues(
        centerPosition[0] + Math.random() * rangeFromCenter - rangeFromCenter / 2,
        centerPosition[1] + Math.random() * rangeFromCenter - rangeFromCenter / 2,
        centerPosition[2] + Math.random() * rangeFromCenter - rangeFromCenter / 2,
      )
      spawnInstanceOfPirate(resources, game, position, [0, 0, 1])
    }
  } else {
    console.log(`Spawning bounty hunter`)
    // spawn bounty hunter or thargoid
    game.extraVesselsSpawningDelay++
    const position = randomPositionInFrontOfPlayer()
    spawnInstanceOfBountyHunter(resources, game, position, [0, 0, 1])
  }
  return true
}

function alwaysSpawnFriendly(resources: Resources, game: Game) {
  const noseOrientation = vec3.fromValues(0, 0, 1)
  spawnInstanceOfTrader(resources, game, randomPositionInFrontOfPlayer(), noseOrientation)
  return true
}

function countOfJunkInLocalBubble(game: Game) {
  return game.localBubble.ships.filter((s) => s.role == ShipRoleEnum.Asteroid || ShipRoleEnum.Cargo).length
}

function randomPositionInFrontOfPlayer() {
  const range = scannerRadialWorldRange[0] / 2
  return vec3.fromValues(
    Math.random() * range - range / 2,
    Math.random() * range - range / 2,
    -scannerRadialWorldRange[2] * 1.2,
  )
}

function spawnInstanceOfTrader(resources: Resources, game: Game, position: vec3, noseOrientation: vec3) {
  log("Spawning trader")
  const shipIndirectIndex = Math.floor(resources.ships.traderIndexes.length * Math.random())
  const shipIndex = resources.ships.traderIndexes[shipIndirectIndex]
  const ship = resources.ships.getIndexedShip(shipIndex, position, noseOrientation)
  setStartingSpeed(ship)
  ship.roll = Math.random() * (ship.blueprint.maxRollSpeed / 4)
  ship.role = ShipRoleEnum.Trader
  ship.missiles = Math.random() > 0.5 ? 1 : 0

  game.localBubble.ships.push(ship)
  return ship
}

function spawnInstanceOfBountyHunter(resources: Resources, game: Game, position: vec3, noseOrientation: vec3) {
  log("Spawning bounty hunter")
  const shipIndirectIndex = Math.floor(resources.ships.bountyHunterIndexes.length * Math.random())
  const shipIndex = resources.ships.bountyHunterIndexes[shipIndirectIndex]
  const ship = resources.ships.getIndexedShip(shipIndex, position, noseOrientation)
  setStartingSpeed(ship)
  ship.roll = Math.random() * (ship.blueprint.maxRollSpeed / 4)
  ship.role = ShipRoleEnum.BountyHunter
  ship.aggressionLevel = 28
  ship.hasECM = true
  ship.aiEnabled = true

  game.localBubble.ships.push(ship)
  return ship
}

function spawnInstanceOfPirate(resources: Resources, game: Game, position: vec3, noseOrientation: vec3) {
  log("Spawning pirate")
  const shipIndirectIndex = Math.floor(resources.ships.pirateIndexes.length * Math.random())
  const shipIndex = resources.ships.pirateIndexes[shipIndirectIndex]
  const ship = resources.ships.getIndexedShip(shipIndex, position, noseOrientation)
  setStartingSpeed(ship)
  ship.roll = Math.random() * (ship.blueprint.maxRollSpeed / 4)
  ship.role = ShipRoleEnum.Pirate
  ship.hasECM = Math.random() < 0.22

  game.localBubble.ships.push(ship)
  return ship
}

function spawnInstanceOfAsteroidOrBoulder(resources: Resources, game: Game, position: vec3, noseOrientation: vec3) {
  const ship = (Math.random() > 0.5 ? resources.ships.getAsteroid : resources.ships.getBoulder)(
    position,
    noseOrientation,
  )
  log(`Spawning ${ship.blueprint.name.toLowerCase()}`)
  setStartingSpeed(ship)
  ship.roll = Math.random() * ship.blueprint.maxRollSpeed
  ship.pitch = Math.random() * ship.blueprint.maxPitchSpeed

  game.localBubble.ships.push(ship)
}

function spawnInstanceOfCargo(resources: Resources, game: Game, position: vec3, noseOrientation: vec3) {
  log("Spawning cargo")
  const ship = resources.ships.getCargo(position, noseOrientation)
  setStartingSpeed(ship)
  ship.roll = Math.random() * ship.blueprint.maxRollSpeed
  ship.pitch = Math.random() * ship.blueprint.maxPitchSpeed

  game.localBubble.ships.push(ship)
}

function setStartingSpeed(ship: ShipInstance) {
  ship.speed = Math.random() * (ship.blueprint.maxSpeed / 2) + ship.blueprint.maxSpeed / 2
}
