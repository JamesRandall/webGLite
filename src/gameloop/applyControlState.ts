import { MissileStatusEnum, Player } from "../model/player"
import { Game } from "../model/game"
import { vec2, vec3 } from "gl-matrix"
import { getNearestSystemToCursor } from "./utilities/map"
import { createDockingComputer } from "./utilities/dockingComputer"
import { Resources } from "../resources/resources"
import { ShipInstance, ShipRoleEnum } from "../model/ShipInstance"
import { ecmDurationSeconds, ecmTotalEnergyCost, ecmWarmUpTimeSeconds, scannerRadialWorldRange } from "../constants"
import { nextEffect, previousEffect } from "../renderer/rootRenderer"

export function applyControlState(game: Game, resources: Resources, timeDelta: number) {
  const player = game.player

  if (!player.isDocked) {
    if (!applyDockingComputer(game, resources, timeDelta)) {
      applyRoll(player, timeDelta)
      applyPitch(player, timeDelta)
      applyAcceleration(player, timeDelta)
      applyJump(game, resources)
      applyHyperspace(game)
    }
    applyLasers(game, timeDelta)
    applyMissiles(game)
    applyEcm(game, resources, timeDelta)
    applyEnergyBomb(game, resources, timeDelta)
  }
  if (game.hyperspace === null) {
    applyCursors(player, timeDelta)
  }
  applyEffects(game)
}

function applyEnergyBomb(game: Game, resources: Resources, timeDelta: number) {
  if (game.player.timeToEnergyBombEnd > 0) {
    game.player.timeToEnergyBombEnd -= timeDelta
  } else if (
    game.player.equipment.energyBomb &&
    game.player.controlState.energyBomb &&
    !game.player.previousControlState.energyBomb
  ) {
    game.player.equipment.energyBomb = false
    game.player.timeToEnergyBombEnd = 2.5
    resources.soundEffects.energyBomb()
    game.localBubble.ships.forEach((s) => (s.isDestroyed = s.role !== ShipRoleEnum.Station))
  }
}

function applyEcm(game: Game, resources: Resources, timeDelta: number) {
  if (
    game.player.controlState.ecm &&
    !game.player.previousControlState.ecm &&
    game.ecmTimings === null &&
    game.player.equipment.ecmSystem &&
    game.player.energyBankLevel >= ecmTotalEnergyCost
  ) {
    game.ecmTimings = { timeRemaining: ecmDurationSeconds, warmUpTimeRemaining: ecmWarmUpTimeSeconds }
    resources.soundEffects.ecm()
  }
}

function applyLasers(game: Game, timeDelta: number) {
  game.player.isLaserFiring = game.player.controlState.firing
}

function applyMissiles(game: Game) {
  if (game.player.missiles.currentNumber > 0) {
    if (
      game.player.controlState.armMissile &&
      !game.player.previousControlState.armMissile &&
      game.player.missiles.status === MissileStatusEnum.Unarmed
    ) {
      game.player.missiles.status = MissileStatusEnum.Armed
    } else if (game.player.controlState.unarmMissile && !game.player.previousControlState.unarmMissile) {
      game.player.missiles.status = MissileStatusEnum.Unarmed
      game.player.missiles.lockedShipId = null
    } else if (
      game.player.controlState.fireMissile &&
      !game.player.previousControlState.fireMissile &&
      game.player.missiles.status === MissileStatusEnum.Locked
    ) {
    }
  }
}

function applyEffects(game: Game) {
  if (game.player.controlState.nextEffectPressed && !game.player.previousControlState.nextEffectPressed) {
    game.renderEffect = nextEffect(game.renderEffect)
  } else if (
    game.player.controlState.previousEffectPressed &&
    !game.player.previousControlState.previousEffectPressed
  ) {
    game.renderEffect = previousEffect(game.renderEffect)
  }
}

function applyDockingComputer(game: Game, resources: Resources, timeDelta: number) {
  if (
    game.player.equipment.dockingComputer &&
    game.player.controlState.dockingOn &&
    !game.player.previousControlState.dockingOn
  ) {
    if (game.player.dockingComputerFlightExecuter === null) {
      game.player.dockingComputerFlightExecuter = createDockingComputer(game)
    } else {
      game.player.dockingComputerFlightExecuter = null
    }
  }

  if (!game.player.dockingComputerFlightExecuter) {
    return false
  }

  game.player.dockingComputerFlightExecuter(game, timeDelta)

  return true
}

function applyHyperspace(game: Game) {
  if (game.player.controlState.hyperspace && !game.player.previousControlState.hyperspace) {
    if (game.hyperspace === null) {
      const selectedSystem = getNearestSystemToCursor(game)
      game.player.selectedSystem = selectedSystem
      if (selectedSystem !== game.currentSystem) {
        const distance = vec2.length(
          vec2.subtract(
            vec2.create(),
            game.player.selectedSystem.galacticPosition,
            game.currentSystem.galacticPosition,
          ),
        )
        if (distance * 10 <= game.player.fuel) {
          game.hyperspace = {
            rotation: 0,
            countdown: 15,
            outboundRadii: [],
            inboundRadii: [],
          }
        }
      }
    }
  }
}

function shipsOnEdgeOfScannerRange(ships: ShipInstance[]) {
  for (var shipIndex = 0; shipIndex < ships.length; shipIndex++) {
    const ship = ships[shipIndex]
    const normalisedPosition = vec3.divide(vec3.create(), ship.position, scannerRadialWorldRange)
    //const scannerRelativeDistance = vec3.length(normalisedPosition)
    if (
      Math.abs(normalisedPosition[0]) < 1.2 &&
      Math.abs(normalisedPosition[1]) < 1.2 &&
      Math.abs(normalisedPosition[2]) < 1.2
    ) {
      return true
    }
  }
  return false
}

function applyJump(game: Game, resources: Resources) {
  const shipsForcingAbort = shipsOnEdgeOfScannerRange(game.localBubble.ships)
  if (game.player.isJumping && shipsForcingAbort) {
    resources.soundEffects.jumpBlocked()
  }
  game.player.isJumping = game.player.controlState.jump && !shipsForcingAbort

  /*if (game.player.controlState.jump) {
        const distance = vec3.length(game.localBubble.planet.position)
        const translation = vec3.fromValues(0, 0, (distance / 2))
        move(game.localBubble.planet, translation)
        move(game.localBubble.sun, translation)
        game.localBubble.ships.forEach(ship => {
            move(ship, translation)
        })
        game.player.controlState.jump = false
    }*/
}

function applyCursors(player: Player, timeDelta: number) {
  let xDelta = 0
  let yDelta = 0
  if (player.controlState.cursorLeft) {
    xDelta -= 10 * timeDelta
  }
  if (player.controlState.cursorRight) {
    xDelta += 10 * timeDelta
  }
  if (player.controlState.cursorUp) {
    yDelta -= 10 * timeDelta
  }
  if (player.controlState.cursorDown) {
    yDelta += 10 * timeDelta
  }
  vec2.add(player.scannerCursor, player.scannerCursor, [xDelta, yDelta])
}

function applyAcceleration(player: Player, timeDelta: number) {
  if (player.controlState.accelerate) {
    player.speed += player.blueprint.speedAcceleration * timeDelta
    if (player.speed > player.blueprint.maxSpeed) {
      player.speed = player.blueprint.maxSpeed
    }
  }
  if (player.controlState.decelerate) {
    player.speed -= player.blueprint.speedAcceleration * timeDelta
    if (player.speed < 0.0) {
      player.speed = 0.0
    }
  }
}

function applyRoll(player: Player, timeDelta: number) {
  if (player.controlState.rollRight) {
    if (!player.previousControlState.rollRight && player.roll < 0) {
      player.roll = 0
    } else {
      player.roll += player.blueprint.rollAcceleration * timeDelta
      if (player.roll > player.blueprint.maxRollSpeed) {
        player.roll = player.blueprint.maxRollSpeed
      }
    }
  } else if (player.roll > 0 && !player.disableDamping) {
    player.roll -= player.blueprint.rollDeceleration * timeDelta
    if (player.roll < 0) {
      player.roll = 0
    }
  }

  if (player.controlState.rollLeft) {
    if (!player.previousControlState.rollLeft && player.roll > 0) {
      player.roll = 0
    } else {
      player.roll -= player.blueprint.rollAcceleration * timeDelta
      if (player.roll < -player.blueprint.maxRollSpeed) {
        player.roll = -player.blueprint.maxRollSpeed
      }
    }
  } else if (player.roll < 0 && !player.disableDamping) {
    player.roll += player.blueprint.rollDeceleration * timeDelta
    if (player.roll > 0) {
      player.roll = 0
    }
  }
}

function applyPitch(player: Player, timeDelta: number) {
  if (player.controlState.pitchDown) {
    if (!player.previousControlState.pitchDown && player.pitch < 0) {
      player.pitch = 0
    } else {
      player.pitch += player.blueprint.pitchAcceleration * timeDelta
      if (player.pitch > player.blueprint.maxPitchSpeed) {
        player.pitch = player.blueprint.maxPitchSpeed
      }
    }
  } else if (player.pitch > 0 && !player.disableDamping) {
    player.pitch -= player.blueprint.pitchDeceleration * timeDelta
    if (player.pitch < 0) {
      player.pitch = 0
    }
  }

  if (player.controlState.pitchUp) {
    if (!player.previousControlState.pitchUp && player.pitch > 0) {
      player.pitch = 0
    } else {
      player.pitch -= player.blueprint.pitchAcceleration * timeDelta
      if (player.pitch < -player.blueprint.maxPitchSpeed) {
        player.pitch = -player.blueprint.maxPitchSpeed
      }
    }
  } else if (player.pitch < 0 && !player.disableDamping) {
    player.pitch += player.blueprint.pitchDeceleration * timeDelta
    if (player.pitch > 0) {
      player.pitch = 0
    }
  }
}
