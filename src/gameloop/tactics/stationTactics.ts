import { Game } from "../../model/game"
import { Resources } from "../../resources/resources"
import { AttitudeEnum, ShipInstance, ShipRoleEnum } from "../../model/ShipInstance"
import { ShipModelEnum } from "../../model/shipBlueprint"
import { vec3 } from "gl-matrix"
import { scannerRadialWorldRange } from "../../constants"

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

function spawnHostileViper(station: ShipInstance, game: Game, resources: Resources) {
  const ship = resources.ships.getInstanceOfModel(ShipModelEnum.Viper, station.position, station.noseOrientation)
  ship.attitude = AttitudeEnum.Hostile
  ship.aiEnabled = true
  ship.aggressionLevel = 28
  ship.speed = (Math.random() * ship.blueprint.maxSpeed) / 2 + ship.blueprint.maxSpeed / 2
  ship.roll = game.localBubble.station?.roll ?? 0
  ship.role = ShipRoleEnum.Police
  ship.missiles = Math.random() > 0.5 ? 1 : 0
  ship.hasECM = Math.random() > 0.5
  game.localBubble.ships.push(ship)
}

export function stationTactics(station: ShipInstance, game: Game, resources: Resources) {
  if (!station.tacticsState.canApplyTactics) return

  if (station.attitude === AttitudeEnum.Hostile && game.player.isInSafeZone) {
    if (Math.random() < 0.062) {
      const numberOfLocalVipers = game.localBubble.ships.filter(
        (s) => s.blueprint.model === ShipModelEnum.Viper && vec3.length(s.position) < scannerRadialWorldRange[0],
      ).length
      if (numberOfLocalVipers < 6) {
        spawnHostileViper(station, game, resources)
      }
    }
  } else {
    if (Math.random() < 0.008) {
      spawnLaunchingTransporterOrShuttle(station, game, resources)
    }
  }
}
