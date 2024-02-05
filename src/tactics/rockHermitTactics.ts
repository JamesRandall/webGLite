import { Game } from "../model/game"
import { Resources } from "../resources/resources"
import { ShipInstance, ShipRoleEnum } from "../model/ShipInstance"
import { log } from "../gameConsole"

function spawnRockHermit(rockHermit: ShipInstance, game: Game, resources: Resources) {
  if (Math.random() > 0.22) return

  const shipIndirectIndex = Math.floor(resources.ships.rockHermitIndexes.length * Math.random())
  const shipIndex = resources.ships.rockHermitIndexes[shipIndirectIndex]
  const ship = resources.ships.getIndexedShip(shipIndex, rockHermit.position, rockHermit.noseOrientation)

  ship.speed = (Math.random() * ship.blueprint.maxSpeed) / 2 + ship.blueprint.maxSpeed / 2
  ship.roll = Math.random() * (ship.blueprint.maxRollSpeed / 4)
  ship.role = ShipRoleEnum.Pirate
  ship.missiles = Math.random() > 0.5 ? 1 : 0
  ship.hasECM = Math.random() > 0.5
  ship.aiEnabled = true
  ship.aggressionLevel = 28
  game.localBubble.ships.push(ship)

  rockHermit.aiEnabled = false
  rockHermit.hasECM = false
}

export function rockHermitTactics(rockHermit: ShipInstance, game: Game, resources: Resources) {
  if (Math.random() > 0.22) return
  spawnRockHermit(rockHermit, game, resources)
}
