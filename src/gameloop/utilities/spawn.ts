import { Game } from "../../model/game"
import { randomiseSpawnDelta } from "../../utilities"
import { ShipRoleEnum } from "../../model/ShipInstance"
import { vec3 } from "gl-matrix"
import { scannerRadialWorldRange } from "../../constants"
import { Resources } from "../../resources/resources"

// this is heavily based on the main loop in the original game amazingly documented here by Mark Moxon:
// https://www.bbcelite.com/master/main/subroutine/main_game_loop_part_2_of_6.html

const spawnSequence = [spawnDockingTrader, spawnLaunchingTrader, spawnFriendly, spawnCop, spawnEnemy]

export function spawnNPCShips(resources: Resources, game: Game, timeDelta: number) {
  if (game.player.isDocked) return

  // when we are jumping we spawn more often
  game.timeUntilNextSpawnChance -= timeDelta * (game.player.isJumping ? 2 : 1)
  if (game.timeUntilNextSpawnChance > 0) return
  game.timeUntilNextSpawnChance = randomiseSpawnDelta()
  spawnSequence.reduce((result, func) => (result ? result : func(resources, game)), false)
}

function spawnDockingTrader(resources: Resources, game: Game) {
  if (!game.player.isInSafeZone) return false
  if (Math.random() > 0.25) return false
  if (countOfJunkInLocalBubble(game) >= 3) return false

  // we need to spawn a trader and attach the docking computer flight path to it

  //return false
  return true
}

function spawnLaunchingTrader(resources: Resources, game: Game) {
  if (!game.player.isInSafeZone || game.localBubble.station === null) return false
  if (Math.random() > 0.25) return false

  const ship = spawnInstanceOfTrader(
    resources,
    game,
    game.localBubble.station.position,
    game.localBubble.station.noseOrientation,
  )
  ship.speed = ship.blueprint.maxSpeed / 4
  ship.roll = game.localBubble.station.roll
  return true
}

function spawnFriendly(resources: Resources, game: Game) {
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
  if (game.player.isInSafeZone) return false
  return false
}

function alwaysSpawnFriendly(resources: Resources, game: Game) {
  const range = scannerRadialWorldRange[0] / 2
  const position = vec3.fromValues(
    Math.random() * range - range / 2,
    Math.random() * range - range / 2,
    -scannerRadialWorldRange[2] * 1.2,
  )
  const noseOrientation = vec3.fromValues(0, 0, 1)
  spawnInstanceOfTrader(resources, game, position, noseOrientation)
  return true
}

function countOfJunkInLocalBubble(game: Game) {
  return game.localBubble.ships.filter((s) => s.role == ShipRoleEnum.Asteroid || ShipRoleEnum.Cargo).length
}

function spawnInstanceOfTrader(resources: Resources, game: Game, position: vec3, noseOrientation: vec3) {
  const shipIndirectIndex = Math.floor(resources.ships.traderIndexes.length * Math.random())
  const shipIndex = resources.ships.traderIndexes[shipIndirectIndex]
  const ship = resources.ships.getIndexedShip(shipIndex, position, noseOrientation)
  ship.speed = Math.random() * (ship.blueprint.maxSpeed / 2) + ship.blueprint.maxSpeed / 2
  ship.roll = Math.random() * (ship.blueprint.maxRollSpeed / 4)
  ship.role = ShipRoleEnum.Trader

  game.localBubble.ships.push(ship)
  return ship
}

function spawnInstanceOfAsteroidOrBoulder(resources: Resources, game: Game, position: vec3, noseOrientation: vec3) {
  spawnInstanceOfTrader(resources, game, position, noseOrientation)
}

function spawnInstanceOfCargo(resources: Resources, game: Game, position: vec3, noseOrientation: vec3) {
  spawnInstanceOfTrader(resources, game, position, noseOrientation)
}
