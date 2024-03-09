import { Resources } from "../../resources/resources"
import { Game, getLaserMountForScene, SceneEnum } from "../../model/game"
import { ShipInstance } from "../../model/ShipInstance"
import { getLaserPower, LaserTypeEnum, Player } from "../../model/player"
import { ShipModelEnum } from "../../model/shipBlueprint"
import { log } from "../../gameConsole"
import { missileDamageAmount } from "../../constants"

export enum DamageLocationEnum {
  Shields,
  Energy,
}

export function damagePlayerWithMissile(game: Game, resources: Resources, ship: ShipInstance) {
  applyDamageToPlayer(game, resources, ship, missileDamageAmount) // missiles damage player by 250 units
  ship.isDestroyed = true
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
  const laserMount = getLaserMountForScene(scene)
  return player.equipment.lasers.get(laserMount) ?? LaserTypeEnum.None
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
