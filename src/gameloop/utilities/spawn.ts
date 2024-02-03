import { Game } from "../../model/game"
import { randomiseSpawnDelta } from "../../utilities"
import { ShipRoleEnum } from "../../model/ShipInstance"
import { vec3 } from "gl-matrix"
import { scannerRadialWorldRange } from "../../constants"
import { Resources } from "../../resources/resources"

// this is heavily based on the main loop in the original game amazingly documented here by Mark Moxon:
// https://www.bbcelite.com/master/main/subroutine/main_game_loop_part_2_of_6.html

const spawnSequence = [alwaysSpawnFriendly]

export function spawnNPCShips(resources: Resources, game: Game, timeDelta: number) {
  if (game.player.isDocked) return

  // when we are jumping we spawn more often
  game.timeUntilNextSpawnChance -= timeDelta * (game.player.isJumping ? 2 : 1)
  if (game.timeUntilNextSpawnChance > 0) return
  game.timeUntilNextSpawnChance = randomiseSpawnDelta()
  //alwaysSpawnFriendly(resources, game)
}

function countOfJunkInLocalBubble(game: Game) {
  return game.localBubble.ships.filter((s) => s.role == ShipRoleEnum.Asteroid || ShipRoleEnum.Cargo).length
}

function spawnTrader(resources: Resources, game: Game, position: vec3, noseOrientation: vec3) {
  const shipIndirectIndex = Math.floor(resources.ships.traderIndexes.length * Math.random())
  const shipIndex = resources.ships.traderIndexes[shipIndirectIndex]
  const ship = resources.ships.getIndexedShip(shipIndex, position, noseOrientation)
  ship.speed = Math.random() * (ship.blueprint.maxSpeed / 2) + ship.blueprint.maxSpeed / 2
  ship.roll = Math.random() * (ship.blueprint.maxRollSpeed / 4)
  game.localBubble.ships.push(ship)
}

function spawnAsteroidOrBoulder(resources: Resources, game: Game, position: vec3, noseOrientation: vec3) {
  spawnTrader(resources, game, position, noseOrientation)
}

function spawnCargo(resources: Resources, game: Game, position: vec3, noseOrientation: vec3) {
  spawnTrader(resources, game, position, noseOrientation)
}

/*
function spawnFriendly(resources: Resources, game: Game): boolean {
  if (Math.random() > 0.13) return false
  if (countOfJunkInLocalBubble(game) >= 3) return false

  // spawn something friendly

  // we place a friendly object roughly in front of the player heading towards the player just outside of the scanner range
  const range = 200
  const position = vec3.fromValues(
    Math.random() * range - range / 2,
    Math.random() * range - range / 2,
    -scannerRadialWorldRange[2],
  )
  const noseOrientation = vec3.fromValues(0, 0, 1)

  if (Math.random() > 0.5) spawnTrader(resources, game, position, noseOrientation)
  else if (Math.random() < 0.985) spawnAsteroidOrBoulder(resources, game, position, noseOrientation)
  else spawnCargo(resources, game, position, noseOrientation)

  return true
}*/

function alwaysSpawnFriendly(resources: Resources, game: Game): boolean {
  const range = 200
  const position = vec3.fromValues(
    Math.random() * range - range / 2,
    Math.random() * range - range / 2,
    -scannerRadialWorldRange[2],
  )
  const noseOrientation = vec3.fromValues(0, 0, 1)
  spawnTrader(resources, game, position, noseOrientation)
  return true
}
