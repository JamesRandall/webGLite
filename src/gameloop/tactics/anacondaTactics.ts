import { AttitudeEnum, ShipInstance } from "../../model/ShipInstance"
import { Game } from "../../model/game"
import { ShipModelEnum } from "../../model/shipBlueprint"
import { Resources } from "../../resources/resources"

export function anacondaTactics(ship: ShipInstance, game: Game, resources: Resources) {
  if (!ship.tacticsState.canApplyTactics) return
  if (!ship.aiEnabled || ship.aggressionLevel === 0) return
  if (Math.random() > 0.22) return

  const model = Math.random() < 0.61 ? ShipModelEnum.Worm : ShipModelEnum.Sidewinder
  const newShip = resources.ships.getInstanceOfModel(model, ship.position, ship.rightOrientation)
  newShip.hasECM = true
  newShip.aiEnabled = true
  newShip.aggressionLevel = 28
  newShip.attitude = AttitudeEnum.Hostile
  game.localBubble.ships.push(newShip)
}
