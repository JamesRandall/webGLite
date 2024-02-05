import { Game } from "../model/game"
import { Resources } from "../resources/resources"
import { AttitudeEnum, ShipInstance, ShipRoleEnum } from "../model/ShipInstance"
import { log } from "../gameConsole"

function spawnLaunchingTransporterOrShuttle(station: ShipInstance, game: Game, resources: Resources) {
  if (!game.player.isInSafeZone || game.localBubble.station === null) return false
  if (Math.random() > 0.25) return false

  const ship = (Math.random() > 0.5 ? resources.ships.getShuttle : resources.ships.getTransporter)(
    station.position,
    station.noseOrientation,
  )
  ship.speed = (Math.random() * ship.blueprint.maxSpeed) / 2 + ship.blueprint.maxSpeed / 2
  ship.roll = game.localBubble.station.roll
  ship.role = ShipRoleEnum.Trader
  ship.missiles = Math.random() > 0.5 ? 1 : 0
  game.localBubble.ships.push(ship)
}

export function stationTactics(station: ShipInstance, game: Game, resources: Resources) {
  if (station.attitude === AttitudeEnum.Hostile) {
    if (Math.random() < 0.062) {
      // SPAWN COP FROM STATION
    }
  } else {
    if (Math.random() < 0.008) {
      spawnLaunchingTransporterOrShuttle(station, game, resources)
    }
  }
}
