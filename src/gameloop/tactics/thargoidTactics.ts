import { AttitudeEnum, ShipInstance } from "../../model/ShipInstance"
import { Game } from "../../model/game"
import { ShipModelEnum } from "../../model/shipBlueprint"
import { Resources } from "../../resources/resources"

export function thargoidTactics(ship: ShipInstance, game: Game, resources: Resources, timeDelta: number) {
  if (!ship.tacticsState.canApplyTactics) return
  if (ship.numberOfShipsToSpawn === 0) return

  if (ship.timeToNextSpawn === null) {
    if (Math.random() > 0.4) return
    spawnThargon(ship, game, resources)
  } else {
    ship.timeToNextSpawn -= timeDelta
    if (ship.timeToNextSpawn <= 0) {
      spawnThargon(ship, game, resources)
    }
  }
}

export function spawnThargon(ship: ShipInstance, game: Game, resources: Resources) {
  const newShip = resources.ships.getInstanceOfModel(ShipModelEnum.Thargon, ship.position, ship.rightOrientation)
  newShip.hasECM = false
  newShip.aiEnabled = true
  newShip.aggressionLevel = 31
  newShip.missiles = 0
  newShip.attitude = AttitudeEnum.Hostile
  game.localBubble.ships.push(newShip)

  ship.numberOfShipsToSpawn--
  if (ship.numberOfShipsToSpawn > 0) {
    ship.timeToNextSpawn = Math.random() * 3
  } else {
    ship.timeToNextSpawn = null
  }
}
