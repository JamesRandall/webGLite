import { Resources } from "../../resources/resources"
import { Game, SceneEnum } from "../../model/game"
import { ShipInstance } from "../../model/ShipInstance"
import { LaserTypeEnum, Player } from "../../model/player"
import { ShipModelEnum } from "../../model/shipBlueprint"
import { log } from "../../gameConsole"

export enum DamageLocationEnum {
  Shields,
  Energy,
}

export function applyDamageToPlayer(game: Game, resources: Resources, ship: ShipInstance, damage: number) {
  const isForeDamage = ship.position[2] < 0
  if (isForeDamage) {
    if (game.player.forwardShield < damage) {
      damage -= game.player.forwardShield
      game.player.forwardShield = 0
    } else {
      game.player.forwardShield -= damage
      damage = 0
    }
  } else {
    if (game.player.aftShield < damage) {
      damage -= game.player.aftShield
      game.player.aftShield = 0
    } else {
      game.player.aftShield -= damage
      damage = 0
    }
  }
  const location = damage > 0 ? DamageLocationEnum.Energy : DamageLocationEnum.Shields
  game.player.energyBankLevel -= damage
  if (game.player.energyBankLevel < 0) {
    game.currentScene = SceneEnum.PlayerExploding
  }
  return location
  // TODO: Occasionally we release some cargo
}

function getLaserForView(player: Player, scene: SceneEnum) {
  switch (scene) {
    case SceneEnum.Rear:
      return player.equipment.aftLaser
    case SceneEnum.Front:
    default:
      return player.equipment.frontLaser
  }
}

function getLaserPower(laserType: LaserTypeEnum) {
  // all but military figured out from here (I hope!)
  switch (laserType) {
    case LaserTypeEnum.Military:
      return Math.round(15 * 1.5) // from here https://www.bbcelite.com/master/main/subroutine/main_flight_loop_part_11_of_16.html
    case LaserTypeEnum.Mining:
      return 50
    case LaserTypeEnum.Pulse:
    case LaserTypeEnum.Beam:
    default:
      return 15
  }
}

export function applyDamageToNpcWithLasers(game: Game, resources: Resources, ship: ShipInstance) {
  const laserType = getLaserForView(game.player, game.currentScene)
  let laserPower = getLaserPower(laserType)
  if (ship.blueprint.model === ShipModelEnum.Constrictor) {
    // need to add the Cougar in at some point
    if (laserType === LaserTypeEnum.Military) {
      laserPower = Math.round(laserPower / 4)
    } else {
      return // only military lasers can damage constrictor and cougar
    }
  }

  ship.energy -= laserPower
  if (ship.energy <= 0) {
    ship.energy = 0
    ship.isDestroyed = true
  }
  log(`Laser hit of ${laserPower} ship has ${ship.energy} remaining`)
}
